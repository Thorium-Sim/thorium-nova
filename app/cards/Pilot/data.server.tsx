import { pubsub } from "@thorium/.server/init/pubsub";
import { t } from "@thorium/.server/init/t";
import { spawnWaypoint } from "@thorium/cards/Navigation/data.server";
import { dockEntities, undock } from "@thorium/utils/.server/docking";
import { cancelLoopingSound, playShipSound } from "@thorium/utils/.server/playRangedSound";
import { scheduleAction } from "@thorium/utils/.server/scheduleAction";
import { checkSystemStability } from "@thorium/utils/.server/ship/checkSystemStability";
import {
	clearAutopilotState,
	deactivateForwardAutopilot,
} from "@thorium/utils/.server/ship/clearAutopilotState";
import { getShipSystem, getShipSystems } from "@thorium/utils/.server/ship/getShipSystem";
import { shipPubsubFilter } from "@thorium/utils/.server/shipPubsubFilter";
import { Entity } from "@thorium/utils/ecs";
import { pathfinder } from "@thorium/utils/starmap/pathfinder.server";
import { Vector3 } from "three";
import z from "zod";

export const pilot = t.router({
	impulseEngines: t.router({
		get: t.procedure
			.input(z.object({ shipId: z.number() }))
			.filter((publish: { shipId: number; systemId: number }, { input }) => {
				if (publish && publish.shipId !== input.shipId) return false;
				return true;
			})
			.autoPublish(
				["isImpulseEngines"],
				(entity) =>
					entity.components.isShipSystem && {
						shipId: entity.components.isShipSystem.shipId,
						systemId: entity.id,
					},
			)
			.request(({ ctx, input: { shipId } }) => {
				// Currently only support one impulse engines
				const impulseEngines = getShipSystem(ctx.ecs, {
					systemType: "impulseEngines",
					shipId,
				});
				const targetSpeed = impulseEngines.components.isImpulseEngines?.targetSpeed || 0;
				const cruisingSpeed = impulseEngines.components.isImpulseEngines?.cruisingSpeed || 1;

				return {
					id: impulseEngines.id,
					name: impulseEngines.components.identity?.name || "Impulse",
					targetSpeed,
					cruisingSpeed,
					emergencySpeed: impulseEngines.components.isImpulseEngines?.emergencySpeed || 1,
					speeds: impulseEngines.components.isImpulseEngines?.speeds || [],
				};
			}),
		ambiance: t.procedure
			.input(z.object({ shipId: z.number() }))
			.autoPublish(["isImpulseEngines"], () => null)

			.request(({ ctx, input: { shipId } }) => {
				const engine = getShipSystem(ctx.ecs, {
					systemType: "impulseEngines",
					shipId,
				});
				const { currentPower, powerLevels } = engine.components.power || {
					currentPower: 0,
					powerLevels: [0],
				};
				const maxSafePower = powerLevels[powerLevels.length - 1];
				const requiredPower = powerLevels[0];
				return [
					{
						id: engine.id,
						volumePercent: Math.min(1, currentPower / requiredPower),
						playbackRate: currentPower / maxSafePower,
						ambiance: engine.components.soundEffects?.soundBank.ambiance,
					},
				];
			}),
		setSpeed: t.procedure
			.input(
				z.object({
					shipId: z.number(),
					systemId: z.number().optional(),
					speed: z.number(),
				}),
			)
			.output(
				z.object({
					shipId: z.number(),
					systemId: z.number().optional(),
					speed: z.number(),
				}),
			)
			.meta({ event: true })
			.send(({ ctx, input: { shipId, systemId, speed } }) => {
				const system = systemId
					? getShipSystem(ctx.ecs, {
							systemId,
						})
					: getShipSystem(ctx.ecs, {
							systemType: "impulseEngines",
							shipId,
						});

				if (!system.components.isImpulseEngines) throw new Error("System is not a impulse engine");

				checkSystemStability(system, "Failed to set impulse speed");

				// Deactivate autopilot when manually setting impulse speed
				const ship = ctx.ecs.getEntityById(shipId);
				if (ship) deactivateForwardAutopilot(ship);

				system.updateComponent("isImpulseEngines", {
					targetSpeed: speed,
				});

				pubsub.publish.pilot.impulseEngines.get({
					shipId,
					systemId: system.id,
				});
				return { shipId, systemId: system.id, speed };
			}),
	}),
	warpEngines: t.router({
		get: t.procedure
			.input(z.object({ shipId: z.number() }))
			.filter((publish: { shipId: number; systemId: number }, { input }) => {
				if (publish && publish.shipId !== input.shipId) return false;
				return true;
			})
			.autoPublish(
				["isWarpEngines"],
				(entity) =>
					entity.components.isShipSystem && {
						shipId: entity.components.isShipSystem.shipId,
						systemId: entity.id,
					},
			)

			.request(({ ctx, input }) => {
				// Currently only support one warp engines
				const warpEngines = getShipSystem(ctx.ecs, {
					systemType: "warpEngines",
					shipId: input.shipId,
				});
				return {
					id: warpEngines.id,
					maxVelocity: warpEngines.components.isWarpEngines?.maxVelocity || 0,
					currentWarpFactor: warpEngines.components.isWarpEngines?.currentWarpFactor || 0,
					interstellarCruisingSpeed:
						warpEngines.components.isWarpEngines?.interstellarCruisingSpeed || 599600000000,
					solarCruisingSpeed: warpEngines.components.isWarpEngines?.solarCruisingSpeed || 29980000,
					speeds: warpEngines.components.isWarpEngines?.speeds || [],
				};
			}),
		setWarpFactor: t.procedure
			.input(
				z.object({
					shipId: z.number(),
					systemId: z.number().optional(),
					factor: z.number(),
				}),
			)
			.output(
				z.object({
					shipId: z.number(),
					systemId: z.number().optional(),
					factor: z.number(),
				}),
			)
			.meta({ event: true })
			.send(({ ctx, input: { systemId, shipId, factor } }) => {
				const system = systemId
					? getShipSystem(ctx.ecs, {
							systemId,
						})
					: getShipSystem(ctx.ecs, {
							systemType: "warpEngines",
							shipId,
						});
				if (!system.components.isWarpEngines) throw new Error("System is not a warp engine");

				checkSystemStability(system, "Failed to set warp engine factor");

				// Deactivate autopilot when manually setting warp factor
				const ship = ctx.ecs.getEntityById(shipId);
				if (ship) deactivateForwardAutopilot(ship);

				system.updateComponent("isWarpEngines", {
					currentWarpFactor: factor,
				});

				pubsub.publish.pilot.warpEngines.get({
					shipId,
					systemId: system.id,
				});
				return { systemId: system.id, shipId, factor };
			}),
	}),
	autopilot: t.router({
		get: t.procedure
			.input(z.object({ shipId: z.number() }))

			.filter((publish: { shipId: number }, { input }) => {
				if (publish && publish.shipId !== input.shipId) return false;
				return true;
			})
			.autoPublish(["autopilot", "facingWaypoints"], (entity) => ({
				shipId: entity.id,
			}))

			.request(({ ctx, input }) => {
				const ship = ctx.ecs.getEntityById(input.shipId);
				const waypointId = ship?.components.autopilot?.destinationWaypointId;
				let destinationName = "";
				let waypoint: Entity | null | undefined;
				if (typeof waypointId === "number") {
					waypoint = ctx.flight?.ecs.getEntityById(waypointId);
					destinationName =
						waypoint?.components.identity?.name.replace(" Waypoint", "").trim() || "";
				}
				const waypointParentId = waypoint?.components.position?.parentId;

				const waypointSystemPosition =
					typeof waypointParentId === "number"
						? ctx.flight?.ecs.getEntityById(waypointParentId)?.components.position || null
						: null;

				return {
					forwardAutopilot: ship?.components.autopilot?.forwardAutopilot,
					destinationName,
					destinationWaypointId: waypointId ?? null,
					destinationPosition: waypoint?.components.position || null,
					destinationSystemPosition: waypointSystemPosition,
					locked: !!ship?.components.autopilot?.desiredCoordinates,
					facingWaypointIds: ship?.components.facingWaypoints?.ids ?? [],
				};
			}),
		lockCourse: t.procedure
			.meta({ event: true })
			.input(z.object({ waypointId: z.number(), shipId: z.number() }))
			.output(z.object({ waypointId: z.number(), shipId: z.number() }))
			.send(({ ctx, input }) => {
				const waypoint = ctx.flight?.ecs.getEntityById(input.waypointId);
				if (waypoint?.components.isWaypoint?.assignedShipId !== input.shipId)
					throw new Error("Invalid waypoint for ship");
				const position = waypoint?.components.position;
				if (!waypoint || !position) throw new Error("Waypoint not found.");
				const ship = ctx.ecs.getEntityById(input.shipId);

				const desiredCoordinates = {
					x: position.x,
					y: position.y,
					z: position.z,
				};
				const path =
					position.parentId === ship?.components.position?.parentId
						? pathfinder(ship, new Vector3(position.x, position.y, position.z))
						: [];
				const nextCoordinates = path?.shift();
				ship?.updateComponent("autopilot", {
					destinationWaypointId: input.waypointId,
					desiredCoordinates,
					path,
					nextCoordinates,
					desiredSolarSystemId: position.parentId,
					rotationAutopilot: true,
					forwardAutopilot: false,
				});

				pubsub.publish.pilot.autopilot.get({ shipId: input.shipId });
				pubsub.publish.starmapCore.autopilot({
					systemId: ship?.components.position?.parentId || null,
				});
				return input;
			}),
		unlockCourse: t.procedure
			.meta({ event: true })
			.input(z.object({ shipId: z.number() }))
			.output(z.object({ shipId: z.number() }))
			.send(({ ctx, input }) => {
				const ship = ctx.ecs.getEntityById(input.shipId);
				if (ship) clearAutopilotState(ship);

				// Clear out the current thruster adjustments
				const thrusters = getShipSystem(ctx.ecs, {
					systemType: "thrusters",
					shipId: ship?.id || -1,
				});
				thrusters?.updateComponent("isThrusters", {
					rotationDelta: { x: 0, y: 0, z: 0 },
				});

				pubsub.publish.pilot.autopilot.get({ shipId: input.shipId });
				pubsub.publish.starmapCore.autopilot({
					systemId: ship?.components.position?.parentId || null,
				});
				return input;
			}),
		activate: t.procedure
			.meta({ event: true })
			.input(z.object({ shipId: z.number() }))
			.output(z.object({ shipId: z.number() }))
			.send(({ ctx, input }) => {
				const ship = ctx.ecs.getEntityById(input.shipId);

				ship?.updateComponent("autopilot", {
					forwardAutopilot: true,
				});
				pubsub.publish.pilot.autopilot.get({ shipId: input.shipId });
				pubsub.publish.starmapCore.autopilot({
					systemId: ship?.components.position?.parentId || null,
				});
				return input;
			}),
		deactivate: t.procedure
			.meta({ event: true })
			.input(z.object({ shipId: z.number() }))
			.output(z.object({ shipId: z.number() }))
			.send(({ ctx, input }) => {
				const ship = ctx.ecs.getEntityById(input.shipId);
				ship?.updateComponent("autopilot", {
					forwardAutopilot: false,
				});
				// We specifically won't clear out the impulse and warp because
				// we want the ship to maintain its current speed.
				pubsub.publish.pilot.autopilot.get({ shipId: input.shipId });
				pubsub.publish.starmapCore.autopilot({
					systemId: ship?.components.position?.parentId || null,
				});

				return input;
			}),
	}),
	thrusters: t.router({
		get: t.procedure.input(z.object({ shipId: z.number() })).request(({ ctx, input }) => {
			const thrusters = getShipSystem(ctx.ecs, { systemType: "thrusters", shipId: input.shipId });
			return { id: thrusters.id };
		}),
		setDirection: t.procedure
			.meta({ event: true })
			.input(
				z.object({
					shipId: z.number(),
					systemId: z.number().optional(),
					direction: z.object({
						x: z.number().optional(),
						y: z.number().optional(),
						z: z.number().optional(),
					}),
				}),
			)
			.output(
				z.object({
					shipId: z.number(),
					systemId: z.number().optional(),
					direction: z.object({
						x: z.number().optional(),
						y: z.number().optional(),
						z: z.number().optional(),
					}),
				}),
			)
			.send(({ ctx, input: { systemId, shipId, direction } }) => {
				const system = systemId
					? getShipSystem(ctx.ecs, {
							systemId,
						})
					: getShipSystem(ctx.ecs, {
							systemType: "thrusters",
							shipId,
						});
				if (!system.components.isThrusters) throw new Error("System is not thrusters");

				checkSystemStability(system, "Failed to set thruster direction");

				// Deactivate autopilot when manually using direction thrusters
				const ship = ctx.ecs.getEntityById(shipId);
				if (ship) deactivateForwardAutopilot(ship);

				const current = system.components.isThrusters.direction;
				system.updateComponent("isThrusters", {
					direction: {
						x: typeof direction.x === "number" ? direction.x : current.x,
						y: typeof direction.y === "number" ? direction.y : current.y,
						z: typeof direction.z === "number" ? direction.z : current.z,
					},
				});

				pubsub.publish.legacy.thrusters.get({ shipId });

				if (!direction.x && !direction.y && !direction.z) {
					// Cancel the looping sound
					cancelLoopingSound(system, "thrust");
				} else if (system.components.soundEffects?.soundBank.thrust) {
					// Only play one instance of the sound
					if (!system.components.soundEffects.looping.some((s) => s.key === "thrust")) {
						const ship = ctx.ecs.getEntityById(shipId);
						playShipSound(system, ship!, "thrust");
					}
				}

				return { systemId, shipId, direction };
			}),
		setRotationDelta: t.procedure
			.input(
				z.object({
					shipId: z.number(),
					systemId: z.number().optional(),
					rotation: z.object({
						x: z.number().optional(),
						y: z.number().optional(),
						z: z.number().optional(),
					}),
				}),
			)
			.output(
				z.object({
					shipId: z.number(),
					systemId: z.number().optional(),
					rotation: z.object({
						x: z.number().optional(),
						y: z.number().optional(),
						z: z.number().optional(),
					}),
				}),
			)
			.meta({ event: true })
			.send(({ ctx, input: { systemId, shipId, rotation } }) => {
				const system = systemId
					? getShipSystem(ctx.ecs, {
							systemId,
						})
					: getShipSystem(ctx.ecs, {
							systemType: "thrusters",
							shipId,
						});
				if (!system.components.isThrusters) throw new Error("System is not thrusters");

				checkSystemStability(system, "Failed to rotate");

				// Deactivate autopilot when manually using rotation thrusters
				const ship = ctx.ecs.getEntityById(shipId);
				if (ship) deactivateForwardAutopilot(ship);

				const current = system.components.isThrusters.rotationDelta;
				system.updateComponent("isThrusters", {
					rotationDelta: {
						x: typeof rotation.x === "number" ? rotation.x : current.x,
						y: typeof rotation.y === "number" ? rotation.y : current.y,
						z: typeof rotation.z === "number" ? rotation.z : current.z,
					},
				});

				if (!rotation.x && !rotation.y && !rotation.z) {
					// Cancel the looping sound
					cancelLoopingSound(system, "thrust");
				} else if (system.components.soundEffects?.soundBank.thrust) {
					// Only play one instance of the sound
					if (!system.components.soundEffects.looping.some((s) => s.key === "thrust")) {
						const ship = ctx.ecs.getEntityById(shipId);
						playShipSound(system, ship!, "thrust");
					}
				}

				return { systemId, shipId, rotation };
			}),
	}),
	docking: t.router({
		get: t.procedure
			.input(z.object({ shipId: z.number() }))
			.filter(shipPubsubFilter)
			.autoPublish(["isDockingPort"], (entity) => ({
				shipId: entity.components.isShipSystem?.shipId || -1,
			}))
			.request(({ ctx, input }) => {
				const dockingPorts = getShipSystems(ctx.ecs, {
					systemType: "dockingPort",
					shipId: input.shipId,
				});

				return dockingPorts.flatMap((d) =>
					d.components.isDockingPort
						? {
								name: d.components.identity?.name || "Docking Port",
								state: d.components.isDockingPort.state,
								connectedShipName: ctx.ecs.getEntityById(
									ctx.ecs.getEntityById(d.components.isDockingPort.connectedPortId || -1)
										?.components.isShipSystem?.shipId || -1,
								)?.components.identity?.name,
								connectedPortName: ctx.ecs.getEntityById(
									d.components.isDockingPort.connectedPortId || -1,
								)?.components.identity?.name,
							}
						: [],
				);
			}),
		requestToDock: t.procedure
			.input(z.object({ shipId: z.number(), hostId: z.number() }))
			.send(({ ctx, input }) => {
				const guest = ctx.ecs.getEntityById(input.shipId);
				const host = ctx.ecs.getEntityById(input.hostId);
				const guestDockingPorts = getShipSystems(ctx.ecs, {
					systemType: "dockingPort",
					shipId: input.shipId,
				});
				const guestDockingPort = guestDockingPorts.find(
					(g) => g.components.isDockingPort?.allowOutgoing,
				);
				if (!guestDockingPort) throw new Error("Guest does not allow outgoing docking");

				const hostDockingPorts = getShipSystems(ctx.ecs, {
					systemType: "dockingPort",
					shipId: input.hostId,
				});
				const category = guest?.components.isShip?.category;
				if (!category) throw new Error("Guest is not a ship.");

				const hostDockingPort = hostDockingPorts.find(
					(p) =>
						p.components.isDockingPort?.state === "idle" &&
						p.components.isDockingPort?.incomingCategories.includes(category),
				);
				if (!hostDockingPort) throw new Error("Host ship has no available docking ports");
				hostDockingPort.updateComponent("isDockingPort", {
					state: "requested",
					connectedPortId: guestDockingPort.id,
				});

				guestDockingPort.updateComponent("isDockingPort", {
					state: "requesting",
					connectedPortId: hostDockingPort.id,
				});
				if (host?.components.isPlayerShip) {
					ctx.ecs.triggerAction(
						"effects.notify",
						{
							shipId: host.id,
							title: "Request to Dock",
							color: "info",
							body: `${guest.components.identity?.name || "A ship"} is requesting to dock.`,
							cards: ["Pilot"],
							actions: [
								{
									label: "Accept",
									blocks: [
										{
											type: "Action",
											id: "accept",
											action: "pilot.docking.respondToRequest",
											values: {
												requestedDockingPortId: hostDockingPort.id,
												response: "accept",
											},
										},
									],
								},
								{
									label: "Deny",
									blocks: [
										{
											type: "Action",
											id: "deny",
											action: "pilot.docking.respondToRequest",
											values: {
												requestedDockingPortId: hostDockingPort.id,
												response: "deny",
											},
										},
									],
								},
							],
						},
						ctx,
					);
				} else {
					// TODO September 29, 2026 — We'll need the automated docking to be more sophisticated.
					// Perhaps an optional allow docking option with a default based on faction fallback.
					scheduleAction(
						ctx.ecs,
						"pilot.docking.respondToRequest",
						{ response: "accept", requestedDockingPortId: hostDockingPort.id },
						Math.random() * 3 + 2, // Between 2 and 5 seconds
					);
				}
				pubsub.publish.pilot.docking.get({ shipId: input.shipId });
				pubsub.publish.pilot.docking.get({ shipId: input.hostId });
			}),
		cancelDocking: t.procedure.input(z.object({ shipId: z.number() })).send(({ ctx, input }) => {
			const hostIds = [];
			for (const guestDockingPort of getShipSystems(ctx.ecs, {
				systemType: "dockingPort",
				shipId: input.shipId,
			})) {
				guestDockingPort.updateComponent("isDockingPort", {
					state: "idle",
					connectedPortId: null,
				});
				const hostDockingPort = ctx.ecs.getEntityById(
					guestDockingPort.components.isDockingPort?.connectedPortId || -1,
				);
				hostDockingPort?.updateComponent("isDockingPort", {
					state: "idle",
					connectedPortId: null,
				});
				hostIds.push(hostDockingPort?.components.isShipSystem?.shipId);
			}

			pubsub.publish.pilot.docking.get({ shipId: input.shipId });
			for (const shipId of hostIds) {
				if (shipId) {
					pubsub.publish.pilot.docking.get({ shipId });
				}
			}
		}),
		respondToRequest: t.procedure
			.input(
				z.object({
					requestedDockingPortId: z.number(),
					response: z.enum(["accept", "deny"]),
					/** Used to switch which docking port the ship will connect with */
					acceptedDockingPortId: z.number().optional(),
				}),
			)
			.send(({ ctx, input }) => {
				const requestedDockingPort = ctx.ecs.getEntityById(input.requestedDockingPortId);
				if (!requestedDockingPort) throw new Error("Docking Port Not Found");
				const requestingDockingPort = ctx.ecs.getEntityById(
					requestedDockingPort?.components.isDockingPort?.connectedPortId || -1,
				);
				if (!requestingDockingPort) throw new Error("Docking Request Not Found");
				const guestShip = ctx.ecs.getEntityById(
					requestingDockingPort.components.isShipSystem?.shipId || -1,
				);
				if (!guestShip) throw new Error("Guest ship not found.");

				if (input.response === "deny") {
					requestedDockingPort.updateComponent("isDockingPort", {
						connectedPortId: null,
						state: "idle",
					});
					requestingDockingPort.updateComponent("isDockingPort", {
						connectedPortId: null,
						state: "idle",
					});
				} else {
					requestedDockingPort.updateComponent("isDockingPort", {
						state: "outgoing",
					});
					requestingDockingPort.updateComponent("isDockingPort", {
						state: "incoming",
					});

					// Create a waypoint for the guest ship to navigate to.
					// It should be twice the length of the guest ship away from the docking port
					// in the orientation direction.

					const position = requestedDockingPort.components.position;
					const hostShip = ctx.ecs.getEntityById(
						requestedDockingPort.components.isShipSystem?.shipId || -1,
					);
					const hostLength = hostShip?.components.size?.length || 350;
					const hostPosition = hostShip!.components.position!;
					const hostRotation = hostShip!.components.rotation!;
					const portPositionVec = new Vector3(position?.x, position?.y, position?.z)
						// Expand to the size of the ship, and convert meters to kilometers at the same time.
						.multiplyScalar(hostLength / 1000)
						// Rotate to orient it the same way as the host ship
						.applyQuaternion(hostRotation)
						// Add the host's position. We now have the world coordinate for the docking port
						.add(hostPosition);
					const distance = ((guestShip?.components.size?.length || 350) * 3) / 1000;
					const orientation = requestedDockingPort.components.isDockingPort!.orientation;
					// Get the orientation vector
					const waypointPosition = new Vector3(orientation.x, orientation.y, orientation.z)
						// Rotate it to match the host's current rotation
						.applyQuaternion(hostRotation)
						// Set the distance
						.multiplyScalar(distance)
						// Add the port's position to get a point out in space.
						.add(portPositionVec);

					const newWaypoint = spawnWaypoint(ctx.ecs, {
						position: waypointPosition,
						shipId: guestShip.id,
						systemId: hostPosition.parentId,
						active: true,
						name: `${hostShip?.components.identity?.name || ""} ${requestedDockingPort.components.identity?.name || "Docking Port"}`.trim(),
						tags: ["docking"],
					});
					ctx.ecs.addEntity(newWaypoint);

					if (!guestShip.components.isPlayerShip) {
						guestShip.updateComponent("shipBehavior", {
							objective: "dock",
							action: "moveTo",
							actionTarget: newWaypoint.id,
							behaviorTarget: hostShip!.id,
						});
					}

					pubsub.publish.waypoints.all({
						shipId: guestShip.id,
					});
				}

				pubsub.publish.pilot.docking.get({
					shipId: requestedDockingPort.components.isShipSystem?.shipId || -1,
				});
				pubsub.publish.pilot.docking.get({
					shipId: requestingDockingPort.components.isShipSystem?.shipId || -1,
				});
			}),

		setClamps: t.procedure
			.input(z.object({ dockingPortId: z.number(), clamps: z.enum(["attached", "detached"]) }))
			.send(({ ctx, input }) => {
				let dockingPort = ctx.ecs.getEntityById(input.dockingPortId);
				if (!dockingPort) throw new Error("Guest docking port not found");
				const guestShip = ctx.ecs.getEntityById(dockingPort.components.isShipSystem?.shipId || -1);
				if (!guestShip) throw new Error("Guest ship not found from docking port");
				const hostDockingPort = ctx.ecs.getEntityById(
					dockingPort.components.isDockingPort?.connectedPortId || -1,
				);
				const hostShip = ctx.ecs.getEntityById(
					hostDockingPort?.components.isShipSystem?.shipId || -1,
				);
				if (
					input.clamps === "detached" &&
					dockingPort.components.isDockingPort?.state !== "clamps"
				) {
					undock(guestShip);
				} else if (hostShip && dockingPort.components.isDockingPort?.state === "outgoing") {
					dockEntities(guestShip, hostShip);
					ctx.flight!.paused = true;
					ctx.ecs.update();
					for (const clientId in ctx.server.clients) {
						const client = ctx.server.clients[clientId];
						if (!client) continue;
						client.sendDataStream();
					}
				}
				pubsub.publish.pilot.docking.get({
					shipId: guestShip.id,
				});
				pubsub.publish.pilot.docking.get({
					shipId: hostShip?.id || -1,
				});
			}),
		setRamps: t.procedure
			.input(z.object({ dockingPortId: z.number(), ramps: z.enum(["extended", "retracted"]) }))
			.send(({ ctx, input }) => {
				let dockingPort = ctx.ecs.getEntityById(input.dockingPortId);
				if (!dockingPort) return;
				const hostDockingPort = ctx.ecs.getEntityById(
					dockingPort.components.isDockingPort?.connectedPortId || -1,
				);
				if (input.ramps === "extended") {
					if (dockingPort.components.isDockingPort?.state !== "clamps") return;
					dockingPort.updateComponent("isDockingPort", { state: "ramps" });
				} else {
					if (dockingPort.components.isDockingPort?.state !== "ramps") return;
					dockingPort.updateComponent("isDockingPort", { state: "clamps" });
				}
				pubsub.publish.pilot.docking.get({
					shipId: dockingPort.components.isShipSystem?.shipId || -1,
				});
				pubsub.publish.pilot.docking.get({
					shipId: hostDockingPort?.components.isShipSystem?.shipId || -1,
				});
			}),
		test: t.procedure.send(({ ctx }) => {
			const hostShip = ctx.ecs.getEntityById(10084)!;
			const guestShip = ctx.ecs.getEntityById(10154)!;
			dockEntities(guestShip, hostShip);
		}),
	}),
	stream: t.procedure
		.input(z.object({ shipId: z.number(), systemId: z.number().nullable() }))
		.dataStream(({ ctx, input }) => {
			const set = new Set<Entity>();
			const ship = ctx.ecs.getEntityById(input.shipId);
			const systemId = input?.systemId || ship?.components.position?.parentId;
			if (typeof systemId === "undefined") {
				return set;
			}
			for (const entity of ctx.ecs.componentCache.get("isImpulseEngines") || []) {
				if (entity.components.isShipSystem?.shipId === input.shipId) {
					set.add(entity);
				}
			}
			for (const entity of ctx.ecs.componentCache.get("isWarpEngines") || []) {
				if (entity.components.isShipSystem?.shipId === input.shipId) {
					set.add(entity);
				}
			}

			for (const entity of ctx.ecs.componentCache.get("position") || []) {
				if (entity.components.position?.parentId === systemId) {
					set.add(entity);
				}
			}

			return set;
		}),
	// Pairs with the ThrustersHelper component
	debugThrustersStream: t.procedure.dataStream(({ ctx }) => {
		const set = new Set<Entity>();
		for (const entity of ctx.ecs.componentCache.get("isThrusters") || []) {
			set.add(entity);
		}
		return set;
	}),
});
