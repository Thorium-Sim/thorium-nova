import { pubsub } from "@thorium/.server/init/pubsub";
import { findClosestNode } from "@thorium/.server/systems/PassengerMovementSystem";
import {
	getCargoRooms,
	getRoomBySystem,
	getRoomsForInventory,
	inventoryToString,
	transferInventory,
} from "@thorium/cards/CargoControl/data.server";
import { getShipSystems } from "@thorium/utils/.server/ship/getShipSystem";
import { getGraph } from "@thorium/utils/.server/ship/shipMapGraph";
import { calculateShipMapPath } from "@thorium/utils/.server/ship/shipMapPathfinder";
import { type Entity, System } from "@thorium/utils/ecs";
import { randomFromList } from "@thorium/utils/operations/randomFromList";
import uniqid from "@thorium/utils/uniqid";
import { noCase } from "change-case";
import { produce } from "immer";

export class ExocompSystem extends System {
	static flightMode = ["nova", "legacy"];
	test(entity: Entity) {
		return !!entity.components.exocomp;
	}
	update(entity: Entity, elapsed: number) {
		const elapsedRatio = elapsed / 1000;
		if (!entity.components.exocomp) return;
		const { instructionIndex, instructions, shipId } = entity.components.exocomp;
		// Perform the instruction
		const currentInstruction = instructions[instructionIndex];
		if (!currentInstruction || currentInstruction.type === "idle") return;

		const damageControlAssignments = new Map<number, Set<Entity>>();
		for (const entity of this.ecs.componentCache.get("damageControlAssignment") || []) {
			if (entity.components.damageControlAssignment?.shipId === shipId) {
				if (entity.components.damageControlAssignment.progress >= 1) continue;
				const systemId = entity.components.damageControlAssignment.systemId;
				if (!damageControlAssignments.has(systemId)) {
					damageControlAssignments.set(systemId, new Set());
				}
				damageControlAssignments.get(systemId)!.add(entity);
			}
		}

		switch (currentInstruction.type) {
			// Traveling to a room
			case "goTo": {
				// Check if we've arrived at the room
				if (checkIfAtRoom(entity, currentInstruction.roomId)) {
					this.advanceInstruction(entity);
					return;
				}
				// Travel to the room
				this.goToRoom(entity, currentInstruction.roomId);
				break;
			}
			case "retrieveCargo": {
				if (
					!entity.components.cargoContainer ||
					!entity.components.passengerMovement ||
					!entity.components.position
				)
					return;
				// If the container is en-route anywhere, just let it keep going
				if (!checkIfAtRoom(entity)) return;

				const { cargo: requestedCargo } = currentInstruction;
				const { contents } = entity.components.cargoContainer;
				const entityRoom = entity.components.passengerMovement.destinationNode;
				const currentRoom = getCargoRooms(this.ecs.getEntityById(shipId)).find(
					(r) => r.id === entityRoom,
				);

				// Transfer any inventory that we need from the room to the exocomp
				if (currentRoom) {
					try {
						const transferred = transferInventory(
							this.ecs,
							currentRoom,
							entity.components.cargoContainer,
							requestedCargo.map((c) => ({ count: c.count, item: c.name })),
						);
						if (Object.keys(transferred).length > 0) {
							this.log(entity, {
								state: "normal",
								text: `Collected cargo from ${currentRoom.name || "room"}: ${inventoryToString(this.ecs, transferred)}`,
							});
							pubsub.publish.exocomps.exocomps({ shipId: entity.components.exocomp?.shipId || -1 });
						}
					} catch (error) {
						console.error(error);
						this.haltWithLog(
							entity,
							`Unable to retrieve cargo${error instanceof Error ? `: ${error.message}.` : "."}`,
						);
					}
				}

				// Travel to rooms for each of the items of cargo
				for (const cargo of requestedCargo) {
					if (cargo.count === 0) continue;
					if (contents[cargo.name] && contents[cargo.name].count >= cargo.count) continue;

					const rooms = getRoomsForInventory(this.ecs.getEntityById(shipId), cargo.name);

					const closestRoom = findClosestNode(
						rooms.map((r) => ({
							id: r.id,
							x: r.position.x,
							y: r.position.y,
							deckIndex: r.deckIndex,
						})),
						entity.components.position,
					);
					if (!closestRoom) continue;

					this.goToRoom(entity, closestRoom.id);
					return;
				}

				// If we reach this point, there is no cargo remaining
				this.advanceInstruction(entity);
				break;
			}

			// Handing cargo
			case "depositCargo": {
				if (!entity.components.cargoContainer || !entity.components.passengerMovement) return;
				const entityRoom = entity.components.passengerMovement.destinationNode;

				const currentRoom = this.ecs
					.getEntityById(shipId)
					?.components.shipMap?.deckNodes.find((r) => r.id === entityRoom);
				if (!currentRoom) {
					this.haltWithLog(entity, `Unable to deposit cargo: Not in room.`);
					return;
				}
				if (!currentRoom.flags.includes("cargo")) {
					this.haltWithLog(entity, `Unable to deposit cargo: No space in room.`);
				}

				try {
					const transferred = transferInventory(
						this.ecs,
						entity.components.cargoContainer,
						currentRoom,
						Object.entries(entity.components.cargoContainer.contents).map(([item, { count }]) => ({
							count,
							item,
						})),
					);
					this.log(entity, {
						state: "normal",
						text: `Transferred cargo to ${currentRoom.name || "room"}: ${inventoryToString(this.ecs, transferred)}`,
					});
					this.advanceInstruction(entity);
				} catch (error) {
					this.haltWithLog(
						entity,
						`Unable to retrieve cargo${error instanceof Error ? `: ${error.message}.` : "."}`,
					);
				}
				break;
			}
			case "useCargo": {
				let hasTransferred = false;

				this.addressAssignment(
					entity,
					damageControlAssignments,
					(assignmentEntity, _, systemEntity) => {
						const assignment = assignmentEntity.components.damageControlAssignment;
						if (!assignment) return;
						const { requiredInventory, requiredAction } = assignment;
						const exocompInventory = entity.components.cargoContainer?.contents;
						const transferredCount: Record<string, number> = {};
						let hasTransferredLocal = false;
						let progress = 0;
						for (const inventory of requiredInventory) {
							if (inventory.count <= inventory.present) continue;
							const inventoryItem = exocompInventory?.[inventory.name];
							if (!inventoryItem) continue;
							const transferredInventory = Math.min(
								inventory.count - inventory.present,
								inventoryItem.count,
							);
							if (transferredInventory === 0) continue;
							inventoryItem.count -= transferredInventory;
							inventory.present += transferredInventory;
							transferredCount[inventory.name] = transferredInventory;
							hasTransferred = true;
							hasTransferredLocal = true;
							progress +=
								Math.min(1, inventory.present / inventory.count) / requiredInventory.length;
						}
						if (hasTransferredLocal) {
							this.log(entity, {
								state: "normal",
								text: `Used cargo on ${systemEntity.components.identity?.name || "system"}: ${inventoryToString(this.ecs, transferredCount)}`,
							});
						}
						// If the assignment has no required instructions, then just using the inventory advances its progress.
						// Set the progress to literally how much inventory has been provided.
						if (!requiredAction) {
							assignmentEntity.updateComponent("damageControlAssignment", { progress });
						}
					},
				);
				if (!hasTransferred) {
					this.log(entity, { state: "warning", text: `Failed to use cargo.` });
				}
				this.advanceInstruction(entity);
				break;
			}

			// Doing repair stuff
			default:
				let didWork = false;
				this.addressAssignment(
					entity,
					damageControlAssignments,
					(assignmentEntity, potentialFailure, systemEntity) => {
						const assignment = assignmentEntity.components.damageControlAssignment;
						if (!assignment) return;
						didWork = true;
						const { requiredInventory, requiredAction, progress } = assignment;
						// We can bail early if the required action is not the same
						if (requiredAction?.type !== currentInstruction.type) {
							potentialFailure.push(
								`${systemEntity.components.identity?.name || "System"} does not require ${noCase(currentInstruction.type)}.`,
							);
							return;
						}
						// Check to make sure all the required inventory is present
						const missingInventory = requiredInventory
							.filter(({ count, present }) => count > present)
							.map(({ count, present, name }) => [name, count - present] as const);
						if (missingInventory.length > 0) {
							potentialFailure.push(
								`${systemEntity.components.identity?.name || "System"} requires the following parts: ${inventoryToString(this.ecs, Object.fromEntries(missingInventory))}.`,
							);
							return;
						}

						// Finally, we can advance the damage assignment progress, based on the duration of the required action
						const newProgress = Math.min(
							1,
							progress + (1 / requiredAction.duration) * elapsedRatio,
						);
						assignmentEntity.updateComponent("damageControlAssignment", { progress: newProgress });
						entity.updateComponent("exocomp", {
							instructionProgress:
								(entity.components.exocomp?.instructionProgress || 0) +
								(1 / currentInstruction.duration) * elapsedRatio,
						});
						if (newProgress === 1) {
							this.log(entity, {
								state: "normal",
								text: `Completed ${noCase(currentInstruction.type)} on ${systemEntity.components.identity?.name || "system"}.`,
							});
							pubsub.publish.exocomps.exocomps({ shipId });
							this.ecs.executeBlocks([
								{
									id: uniqid("blo-"),
									type: "Action",
									action: "damageReports.completeDamageAssignment",
									values: {
										damageAssignmentId: assignmentEntity.id,
									},
								},
							]);
							this.advanceInstruction(entity);
						} else {
							// If we haven't logged about starting this work, then put the log in there
							if (
								!entity.components.exocomp?.logs
									.at(-1)
									?.text.startsWith(`Started ${currentInstruction.type} operation.`)
							) {
								this.log(entity, {
									state: "normal",
									text: `Started ${currentInstruction.type} operation.`,
								});
								pubsub.publish.exocomps.exocomps({ shipId });
							}
						}
						potentialFailure = [];
					},
				);
				if (!didWork) {
					if (!entity.components.exocomp || !entity.components.passengerMovement) return;
					const entityRoom = entity.components.passengerMovement.destinationNode;

					const currentRoom = this.ecs
						.getEntityById(shipId)
						?.components.shipMap?.deckNodes.find((r) => r.id === entityRoom);
					this.log(entity, {
						state: "warning",
						text: `No work to do in ${currentRoom?.name || "room"}.`,
					});
					pubsub.publish.exocomps.exocomps({ shipId });
					this.advanceInstruction(entity);
				}
		}
	}
	addressAssignment(
		entity: Entity,
		damageControlAssignments: Map<number, Set<Entity>>,
		action: (assignmentEntity: Entity, potentialFailure: string[], systemEntity: Entity) => void,
	) {
		if (!entity.components.exocomp || !entity.components.passengerMovement) return;
		const { instructionIndex, instructions, shipId } = entity.components.exocomp;
		const currentInstruction = instructions[instructionIndex];
		// Figure out which system we're repairing based on the room that we're in
		const entityRoom = entity.components.passengerMovement.destinationNode;
		const currentRoom = this.ecs
			.getEntityById(shipId)
			?.components.shipMap?.deckNodes.find((r) => r.id === entityRoom);
		if (!currentRoom) {
			this.haltWithLog(entity, `Unable to ${currentInstruction.type}: Not in room.`);
			return;
		}
		// We don't fail immediately, just in case there's another system in this room that does need the Exocomp
		let potentialFailure: string[] = [];
		for (const systemType of currentRoom.systems) {
			const systemEntities = getShipSystems(this.ecs, { systemType: systemType as any, shipId });
			for (const systemEntity of systemEntities) {
				const damageToFix = damageControlAssignments.get(systemEntity.id);
				for (const assignmentEntity of damageToFix || []) {
					action(assignmentEntity, potentialFailure, systemEntity);
				}
			}
		}
		if (potentialFailure.length > 0) {
			this.haltWithLog(entity, potentialFailure[0]);
			return;
		}
	}
	advanceInstruction(entity: Entity) {
		if (!entity.components.exocomp) return;
		const { instructionIndex, instructions, shipId } = entity.components.exocomp;

		if (instructionIndex + 1 >= instructions.length) {
			this.log(entity, { state: "normal", text: "Instructions complete. Ready for new orders." });
			entity.updateComponent("exocomp", {
				instructionIndex: -1,
				instructions: [],
				instructionProgress: 0,
			});
		} else {
			entity.updateComponent("exocomp", {
				instructionIndex: instructionIndex + 1,
				instructionProgress: 0,
			});
		}
		pubsub.publish.exocomps.exocomps({ shipId });
	}

	goToRoom(entity: Entity, roomId: number) {
		if (
			!entity.components.exocomp ||
			!entity.components.passengerMovement ||
			!entity.components.position
		)
			return;

		const { destinationNode } = entity.components.passengerMovement;
		const { shipId } = entity.components.exocomp;
		const ship = this.ecs.getEntityById(shipId);
		if (!ship) return;
		if (!ship.components.shipMap) return;
		const graph = getGraph(ship);
		const room = ship.components.shipMap.deckNodes.find((d) => d.id === roomId);

		if (destinationNode !== roomId) {
			const closestNode = findClosestNode(
				ship.components.shipMap.deckNodes,
				entity.components.position,
			);
			if (!closestNode) {
				this.haltWithLog(entity, `Unable to find path to ${room?.name || "room"}.`);
				return;
			}
			const nodePath = calculateShipMapPath(graph, closestNode.id, roomId);

			if (!nodePath) {
				this.haltWithLog(entity, `Unable to find path to ${room?.name || "room"}.`);
				return;
			}
			entity.updateComponent("passengerMovement", {
				destinationNode: roomId,
				nodePath,
				nextNodeIndex: 0,
			});
			const decks = ship.components.shipMap.decks;
			const deck = decks[room?.deckIndex || -1]?.name;
			this.log(entity, {
				state: "normal",
				text: `Going to ${room?.name || "room"}${decks.length > 0 && deck ? `, ${deck}` : ""}.`,
			});
			pubsub.publish.exocomps.exocomps({ shipId: entity.components.exocomp?.shipId || -1 });
		}
	}
	log(entity: Entity, log: { state: "error" | "warning" | "normal"; text: string }) {
		if (
			!entity.components.exocomp ||
			!entity.components.passengerMovement ||
			!entity.components.position
		)
			return;

		const { logs } = entity.components.exocomp;

		entity.updateComponent("exocomp", {
			logs: produce(logs, (draft) => {
				draft.push({ ...log, timestamp: Date.now() });
			}),
		});
	}
	haltWithLog(entity: Entity, text: string) {
		this.log(entity, { state: "error", text });
		entity.updateComponent("exocomp", {
			instructions: [],
			instructionIndex: -1,
		});
		pubsub.publish.exocomps.exocomps({ shipId: entity.components.exocomp?.shipId || -1 });
	}
}

export class ExocompPowerSystem extends System {
	static flightMode = ["nova", "legacy"];
	test(entity: Entity) {
		return !!entity.components.isExocomps;
	}
	update(entity: Entity, elapsed: number) {
		const elapsedTimeHours = elapsed / 1000 / 60 / 60;
		const ship = this.ecs.getEntityById(entity.components.isShipSystem?.shipId || -1);
		if (!ship) return;
		const exocompRooms = getRoomBySystem(ship, "exocomps").map((i) => i.id);
		if (exocompRooms.length === 0) return;
		const chargingExocomps = new Set<Entity>();

		// Charge any exocomps that are in the same room as the exocomp system
		for (const exocomp of this.ecs.componentCache.get("exocomp") || []) {
			if (!exocomp.components.exocomp) continue;
			const {
				maxCharge,
				currentCharge,
				idleDischargeRate,
				movingDischargeRate,
				workingDischargeRate,
				instructionIndex,
				instructions,
				logs,
			} = exocomp.components.exocomp;
			// If node path is empty, then the entity is sitting in a room.
			const currentInstruction = instructions[instructionIndex];

			if (
				exocompRooms.includes(exocomp.components.passengerMovement?.destinationNode || -1) &&
				exocomp.components.passengerMovement?.nodePath.length === 0
			) {
				// Recharge!
				if (currentCharge < maxCharge) {
					chargingExocomps.add(exocomp);
				}
			} else {
				// The exocomp is doing stuff! Discharge it
				if (!currentInstruction || currentInstruction.type === "idle") {
					exocomp.updateComponent("exocomp", {
						currentCharge: Math.max(0, currentCharge - idleDischargeRate * elapsedTimeHours),
					});
				} else if (["goTo", "retrieveCargo", "returnHome"].includes(currentInstruction.type)) {
					exocomp.updateComponent("exocomp", {
						currentCharge: Math.max(0, currentCharge - movingDischargeRate * elapsedTimeHours),
					});
				} else {
					exocomp.updateComponent("exocomp", {
						currentCharge: Math.max(0, currentCharge - workingDischargeRate * elapsedTimeHours),
					});
				}
			}
			const inExocompRoom = exocompRooms.some((room) => checkIfAtRoom(exocomp, room));
			if (
				exocomp.components.exocomp.currentCharge === 0 &&
				(!currentInstruction || currentInstruction.type !== "goTo") &&
				!inExocompRoom
			) {
				// The exocomp is out of power and needs to return home.
				exocomp.updateComponent("passengerMovement", { movementVelocityMultiplier: 0.7 });
				exocomp.updateComponent("exocomp", {
					instructions: [{ type: "goTo", roomId: randomFromList(exocompRooms) }],
					instructionIndex: 0,
					logs: produce(logs, (draft) => {
						draft.push({
							state: "error",
							text: "Power depleted. Returning home.",
							timestamp: Date.now(),
						});
					}),
				});
			}
		}

		// Distribute the current power among all of the exocomps
		const currentPower = entity.components.power?.currentPower || 0;
		const exocompPower = currentPower / (chargingExocomps.size || 1);
		for (const exocomp of chargingExocomps) {
			exocomp.updateComponent("exocomp", {
				currentCharge: Math.min(
					exocomp.components.exocomp?.maxCharge || Number.POSITIVE_INFINITY,
					(exocomp.components.exocomp?.currentCharge || 0) + exocompPower * elapsedTimeHours,
				),
			});
			if (
				!exocomp.components.passengerMovement?.movementVelocityMultiplier ||
				exocomp.components.passengerMovement?.movementVelocityMultiplier < 1
			) {
				exocomp.updateComponent("passengerMovement", { movementVelocityMultiplier: 1 });
			}
		}
	}
}

function checkIfAtRoom(entity: Entity, roomId?: number): boolean {
	if (
		!entity.components.exocomp ||
		!entity.components.passengerMovement ||
		!entity.components.position
	)
		return false;

	if (roomId && entity.components.passengerMovement.destinationNode !== roomId) return false;
	return entity.components.passengerMovement.nodePath.length === 0;
}
