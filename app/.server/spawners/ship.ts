import path from "node:path";

import type { FlightDataModel } from "@thorium/.server/classes/FlightDataModel";
import type ShipPlugin from "@thorium/.server/classes/Plugins/Ship";
import type BaseShipSystemPlugin from "@thorium/.server/classes/Plugins/ShipSystems/BaseSystem";
import type PhasersPlugin from "@thorium/.server/classes/Plugins/ShipSystems/Phasers";
import ReactorPlugin from "@thorium/.server/classes/Plugins/ShipSystems/Reactor";
import type { ServerDataModel } from "@thorium/.server/classes/ServerDataModel";
import type { position } from "@thorium/ecs-components/position";
import { getInventoryTemplates } from "@thorium/utils/.server/getInventoryTemplates";
import { loadGltf } from "@thorium/utils/.server/loadGltf";
import { greekLetters } from "@thorium/utils/constants";
import { Entity } from "@thorium/utils/ecs";
import { mergeDeep } from "@thorium/utils/operations/mergeDeep";
import { randomFromList } from "@thorium/utils/operations/randomFromList";
import { capitalCase } from "change-case";
import { Box3, Vector3 } from "three";
import type z from "zod";

import { generateShipInventory } from "./inventory";
import { spawnShipSystem } from "./shipSystem";

const systemCache: Record<string, BaseShipSystemPlugin> = {};
function getSystem(
	dataContext: { flight: FlightDataModel | null; server: ServerDataModel },
	systemId: string,
	pluginId: string,
) {
	if (!systemCache[`${systemId}-${pluginId}`]) {
		const plugin = dataContext.server.plugins.find((plugin) => pluginId === plugin.id);
		const systemPlugin = plugin?.aspects.shipSystems.find((sys) => sys.name === systemId);
		if (!systemPlugin) return undefined;
		systemCache[`${systemId}-${pluginId}`] = systemPlugin;
	}
	return systemCache[`${systemId}-${pluginId}`];
}
export async function spawnShip(
	dataContext: { flight: FlightDataModel | null; server: ServerDataModel },
	template: Partial<ShipPlugin>,
	params: {
		name?: string;
		description?: string;
		registry?: string;
		position?: z.infer<typeof position>;
		tags?: string[];
		assets?: Partial<InstanceType<typeof ShipPlugin>["assets"]>;
		playerShip?: boolean;
		flightMode: "nova" | "legacy";
	},
) {
	if (!dataContext.flight) throw new Error("No flight has been started.");
	const inventoryTemplates = getInventoryTemplates(dataContext.flight?.ecs);

	const entity = new Entity();
	const shipId = entity.id;

	entity.addComponent("identity", {
		name: params.name || template.name,
		description: template.description,
	});
	entity.addComponent("tags", {
		tags: (template.tags ?? []).concat(params.tags ?? []),
	});
	// TODO November 16, 2021 - write a function to generate registry numbers. Maybe based off the faction.
	entity.addComponent("isShip", {
		category: template.category,
		registry: params.registry || "",
		shipClass: template.name,
		assets: {
			...template.assets,
			...params.assets,
		},
	});
	// TODO September 3, 2024 - Make this configurable on the ship template
	entity.addComponent("hull", { hull: 10 });
	if (params.position) {
		entity.addComponent("position", params.position);
	}
	entity.addComponent("rotation");
	entity.addComponent("velocity");
	entity.addComponent("rotationVelocity");
	entity.addComponent("reputation");

	const modelPath = path.join((await template.getAssetUrl!()) || "", template.assets!.model);
	const size =
		modelPath && modelPath !== "." ? await getMeshSize(modelPath) : new Vector3(10, 10, 10);

	size.multiplyScalar(template.length || 1);
	entity.addComponent("size", {
		length: size.x,
		width: size.y,
		height: size.z,
	});

	entity.addComponent("mass", { mass: template.mass });

	entity.addComponent("shipSystems");
	entity.addComponent("nearbyObjects", { objects: new Map() });
	entity.addComponent("facingWaypoints");

	if (params.playerShip) {
		entity.addComponent("isPlayerShip");
		entity.addComponent("physicsHandles");
		entity.addComponent("tweaks");
		entity.addComponent("shipAlerts");
	} else {
		entity.addComponent("shipBehavior", {
			objective: "hold",
			behaviorTarget: entity.components.position,
			actionTarget: entity.components.position,
		});
		entity.addComponent("autopilot");
	}

	// Rooms need to be spawned before ship systems so systems can place entities inside
	const extraEntities: Entity[] = [];
	// Initialize the ship map. For now, we'll just load the ship map onto a component of the ship.
	// In the future, rooms themselves might become entities.
	if (entity.components.isPlayerShip && template.decks && template.decks?.length > 0) {
		const deckNodes =
			template.decks?.flatMap((deck, i) =>
				deck.nodes.map((n) => ({ ...n, deckIndex: i, contents: {} })),
			) || [];

		entity.addComponent("shipMap", {
			decks: template.decks || [],
			deckNodes,
			deckEdges: template.deckEdges || [],
		});

		// Place cargo containers
		Array.from({ length: template.cargoContainers || 0 }).forEach((_, i) => {
			// TODO June 24, 2022: Maybe make this use the ECS PRNG
			const randomRoom = randomFromList(deckNodes.filter((n) => n.isRoom));
			if (!randomRoom) return;
			const cargoContainer = new Entity();
			cargoContainer.addComponent("identity", {
				name: `Container ${greekLetters[i]}${i > 25 ? i : ""}`,
			});
			cargoContainer.addComponent("isCargoContainer");
			cargoContainer.addComponent("cargoContainer", {
				volume: template.cargoContainerVolume || 1,
			});
			cargoContainer.addComponent("position", {
				x: randomRoom.x,
				y: randomRoom.y,
				z: randomRoom.deckIndex,
				type: "ship",
				parentId: entity.id,
			});
			cargoContainer.addComponent("passengerMovement", {
				destinationNode: randomRoom.id,
			});
			extraEntities.push(cargoContainer);
		});
	} else {
		// Give the ship some cargo space without creating any rooms
		entity.addComponent("cargoContainer", {
			// TODO June 24, 2022: Make this a configurable value
			volume: 500,
		});
	}

	const shipRooms = entity.components.shipMap?.deckNodes || [];

	const systemEntities: Entity[] = [];
	let phaseCapacitorCount = 0;

	const batteries: { id: number; output: number; capacity: number; assignmentCount: number }[] = [];
	// Spawn batteries first so we can attach them to systems later
	template.shipSystems?.forEach((system) => {
		const systemPlugin = getSystem(dataContext, system.systemId, system.pluginId);
		if (!systemPlugin || systemPlugin.type !== "battery") return;
		// @ts-expect-error
		if (!systemPlugin.constructor.flightModes.includes(params.flightMode)) return;

		if (params.playerShip) {
			const [entity, ...rest] = spawnShipSystem(
				shipId,
				systemPlugin,
				params.flightMode,
				shipRooms,
				params.playerShip,
				system.overrides,
			);
			if (entity.components.isBattery) {
				entity.updateComponent("isBattery", {
					storage: entity.components.isBattery.capacity * 0.2,
				});
				batteries.push({
					id: entity.id,
					output: entity.components.isBattery.outputRate,
					capacity: entity.components.isBattery.capacity,
					assignmentCount: 0,
				});
			}
			systemEntities.push(entity, ...rest);
		}
	});

	template.shipSystems?.forEach((system) => {
		const systemPlugin = getSystem(dataContext, system.systemId, system.pluginId);
		if (!systemPlugin) return;
		// @ts-expect-error
		if (!systemPlugin.constructor.flightModes.includes(params.flightMode)) return;
		switch (systemPlugin.type) {
			case "reactor":
				// Reactors are special, so take care of them later.

				break;
			case "battery": {
				// Already handled above

				break;
			}
			case "shields": {
				// Create enough shield systems for each shield
				const shieldDirections = ["fore", "aft", "port", "starboard", "dorsal", "ventral"];
				const shieldCount =
					system.overrides?.shieldCount ||
					("shieldCount" in systemPlugin && systemPlugin.shieldCount) ||
					1;
				for (let i = 0; i < shieldCount; i++) {
					const [entity, ...rest] = spawnShipSystem(
						shipId,
						systemPlugin,
						params.flightMode,
						shipRooms,
						params.playerShip,
						{
							...system.overrides,
							direction: shieldDirections[i],
						},
					);
					if (shieldCount > 1) {
						entity.updateComponent("identity", {
							name: `${capitalCase(shieldDirections[i])} ${
								entity.components.identity?.name || "Shields"
							}`,
						});
					}
					systemEntities.push(entity, ...rest);

					assignBattery(entity, batteries, systemPlugin.connectedBatteryType);
				}
				break;
			}
			case "phasers": {
				phaseCapacitorCount += 1;
				const [phaser, ...rest] = spawnShipSystem(
					shipId,
					systemPlugin,
					params.flightMode,
					shipRooms,
					params.playerShip,
					system.overrides,
				);

				systemEntities.push(phaser, ...rest);

				const template = mergeDeep(systemPlugin, system.overrides || {}) as PhasersPlugin;

				// We'll let phasers add their own batteries to simplify config.
				if (params.flightMode === "nova") {
					const [capacitor] = spawnShipSystem(
						shipId,
						{ type: "battery" },
						params.flightMode,
						shipRooms,
						params.playerShip,
						{},
					);
					capacitor.updateComponent("identity", {
						name: `Phase Capacitor ${phaseCapacitorCount}`,
					});
					capacitor.addComponent("isPhaseCapacitor");
					capacitor.updateComponent("isBattery", {
						storage: 0,
						capacity: template.fullChargeYield,
						outputRate: phaser.components.power?.powerLevels.at(-1) || 1,
						chargeRate: phaser.components.power?.powerLevels[0] || 1,
					});
					systemEntities.push(capacitor, ...rest);
					phaser.updateComponent("power", {
						batterySource: capacitor.id,
					});
				}

				break;
			}
			default: {
				const [entity, ...rest] = spawnShipSystem(
					shipId,
					systemPlugin,
					params.flightMode,
					shipRooms,
					params.playerShip,
					system.overrides,
				);
				systemEntities.push(entity, ...rest);
				assignBattery(entity, batteries, systemPlugin.connectedBatteryType);
				break;
			}
		}
	});

	// Now let's power up the reactors. We'll start with the reactors providing the minimum power for the entire ship.
	const totalPower = systemEntities.reduce((prev, next) => {
		return prev + (next.components.power?.powerLevels[0] || 0);
	}, 0);
	if (params.playerShip) {
		const reactorCount =
			params.flightMode === "legacy"
				? 1
				: template.shipSystems?.reduce((prev, system) => {
						const systemPlugin = getSystem(dataContext, system.systemId, system.pluginId);
						if (systemPlugin instanceof ReactorPlugin) {
							return prev + (system.overrides?.reactorCount || systemPlugin.reactorCount);
						}
						return prev;
					}, 0) || 1;

		// Split amongst the reactors and generously make it a nice round number
		const reactorPower = Math.ceil(totalPower / reactorCount / 10) * 10;

		template.shipSystems?.forEach((system) => {
			const systemPlugin = getSystem(dataContext, system.systemId, system.pluginId);
			if (systemPlugin instanceof ReactorPlugin) {
				Array.from({ length: reactorCount }).forEach(() => {
					const [sys, ...rest] = spawnShipSystem(
						shipId,
						systemPlugin,
						params.flightMode,
						shipRooms,
						params.playerShip,
						system.overrides,
					);
					const maxOutput = reactorPower * systemPlugin.powerMultiplier;
					sys.updateComponent("isReactor", {
						maxOutput,
						currentOutput: maxOutput * systemPlugin.optimalOutputPercent,
						optimalOutputPercent: systemPlugin.optimalOutputPercent,
					});
					systemEntities.push(sys, ...rest);
				});
			}
		});
	}

	systemEntities.forEach((e) => {
		entity.components.shipSystems?.shipSystems.set(e.id, {});
	});

	// Create inventory
	if (
		entity.components.shipMap?.deckNodes &&
		entity.components.isPlayerShip &&
		template.decks &&
		template.decks?.length > 0
	) {
		const deckNodes = entity.components.shipMap.deckNodes;

		generateShipInventory(
			deckNodes.map((node) => ({
				id: node.id,
				contents: node.contents,
				flags: node.flags,
				volume: node.volume,
				systems: node.systems,
			})),
			inventoryTemplates,
			{
				powerNeed: totalPower * 2.5, // Convert megawatts into 2.5 MegaWatt hours
			},
		);
	} else {
		generateShipInventory(
			[
				{
					id: entity.id,
					contents: entity.components.cargoContainer?.contents || {},
					flags: ["cargo", "torpedoStorage"],
					volume: entity.components.cargoContainer?.volume || 500,
					systems: ["torpedoLauncher"],
				},
			],
			inventoryTemplates,
			{
				powerNeed: totalPower * 2.5, // Convert megawatts into 2.5 MegaWatt hours, so we have enough for a 2.5 hour trip
			},
		);
	}

	// With the deck map initialized, we can now assign rooms to systems
	let occupiedRooms: number[] = [];
	for (const [id, info] of entity.components.shipSystems?.shipSystems || []) {
		const system = systemEntities.find((sys) => sys.id === id);
		const systemType = system?.components.isShipSystem?.type;
		if (!systemType) continue;
		const availableRooms =
			entity.components.shipMap?.deckNodes.filter((node) => node.systems?.includes(systemType)) ||
			[];

		if (occupiedRooms.length === availableRooms.length) {
			occupiedRooms = [];
		}
		availableRooms.filter((a) => !occupiedRooms.includes(a.id));

		const roomAssignment = randomFromList(availableRooms);
		if (!roomAssignment) continue;
		occupiedRooms.push(roomAssignment.id);
		entity.components.shipSystems?.shipSystems.set(id, {
			...info,
			roomId: roomAssignment.id,
		});
	}

	return { ship: entity, extraEntities: systemEntities.concat(extraEntities) };
}

async function getMeshSize(url: string | null): Promise<Vector3> {
	if (!url) return new Vector3(1, 1, 1);
	const gltf = await loadGltf(url);
	if (!gltf) return new Vector3();
	const box = new Box3().setFromObject(gltf.scene.children[0]);

	const vector = box.getSize(new Vector3()).normalize();
	const { x } = vector;
	// Rearrange the vector to match the orientation of the ship
	vector.normalize().multiplyScalar(1 / x);

	return vector;
}

function assignBattery(
	entity: Entity,
	batteries: { id: number; output: number; capacity: number; assignmentCount: number }[],
	batteryType: "none" | "capacity" | "median" | "output",
) {
	const batteriesHalf = batteries.length / 2;

	let batteryCapacityMedian =
		batteries.sort((a, b) => b.capacity - a.capacity)[Math.floor(batteriesHalf)]?.capacity || 0;
	if (!Number.isInteger(batteriesHalf)) {
		const upperMedian = batteries.sort((a, b) => b.capacity - a.capacity)[Math.ceil(batteriesHalf)];
		if (upperMedian) {
			batteryCapacityMedian = (batteryCapacityMedian + upperMedian.capacity) / 2;
		}
	}
	let batteryOutputMedian =
		batteries.sort((a, b) => b.output - a.output)[Math.floor(batteriesHalf)]?.output || 0;
	if (!Number.isInteger(batteriesHalf)) {
		const upperMedian = batteries.sort((a, b) => b.output - a.output)[Math.ceil(batteriesHalf)];
		if (upperMedian) {
			batteryOutputMedian = (batteryOutputMedian + upperMedian.output) / 2;
		}
	}

	// Start by getting the batteries that closest match, ordered by assignment count.
	// If there are none, then widen the scope so that _any_ battery is assigned.

	switch (batteryType) {
		case "none":
			break;
		case "capacity":
			{
				let battery = batteries
					.filter((b) => b.capacity > batteryCapacityMedian)
					.sort((a, b) => a.assignmentCount - b.assignmentCount)[0];
				if (!battery) {
					battery = batteries.sort((a, b) => {
						if (a.capacity === b.capacity) return a.assignmentCount - b.assignmentCount;
						return b.capacity - a.capacity;
					})[0];
				}
				entity.updateComponent("power", { batterySource: battery?.id || null });
			}
			break;
		case "output":
			{
				let battery = batteries
					.filter((b) => b.output > batteryOutputMedian)
					.sort((a, b) => a.assignmentCount - b.assignmentCount)[0];
				if (!battery) {
					battery = batteries.sort((a, b) => {
						if (a.output === b.output) return a.assignmentCount - b.assignmentCount;
						return b.output - a.output;
					})[0];
				}
				entity.updateComponent("power", { batterySource: battery?.id || null });
			}
			break;
		case "median":
			// Whichever has the shortest distance to the medians
			{
				let battery = batteries.sort((a, b) => {
					const aOutputDistance = Math.abs(a.output - batteryOutputMedian);
					const aCapacityDistance = Math.abs(a.capacity - batteryCapacityMedian);
					const aDistance = aCapacityDistance + aOutputDistance;

					const bOutputDistance = Math.abs(b.output - batteryOutputMedian);
					const bCapacityDistance = Math.abs(b.capacity - batteryCapacityMedian);
					const bDistance = bCapacityDistance + bOutputDistance;

					if (aDistance !== bDistance) {
						return aDistance - bDistance;
					}
					return a.assignmentCount - b.assignmentCount;
				})[0];
				entity.updateComponent("power", { batterySource: battery?.id || null });
			}
			break;
	}
}
