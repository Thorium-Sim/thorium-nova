import { t } from "@thorium/.server/init/t";
import { pubsub } from "@thorium/.server/init/pubsub";
import { getShipSystem } from "@thorium/utils/.server/ship/getShipSystem";
import {
	clearAutopilotState,
	deactivateForwardAutopilot,
} from "@thorium/utils/.server/ship/clearAutopilotState";
import { z } from "zod";
import type { Entity } from "@thorium/utils/ecs";
import {
	cancelLoopingSound,
	playShipSound,
} from "@thorium/utils/.server/playRangedSound";
import { Vector3 } from "three";
import { pathfinder } from "@thorium/utils/starmap/pathfinder.server";

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
				const targetSpeed =
					impulseEngines.components.isImpulseEngines?.targetSpeed || 0;
				const cruisingSpeed =
					impulseEngines.components.isImpulseEngines?.cruisingSpeed || 1;

				return {
					id: impulseEngines.id,
					name: impulseEngines.components.identity?.name || "Impulse",
					targetSpeed,
					cruisingSpeed,
					emergencySpeed:
						impulseEngines.components.isImpulseEngines?.emergencySpeed || 1,
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

				if (!system.components.isImpulseEngines)
					throw new Error("System is not a impulse engine");

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
					currentWarpFactor:
						warpEngines.components.isWarpEngines?.currentWarpFactor || 0,
					interstellarCruisingSpeed:
						warpEngines.components.isWarpEngines?.interstellarCruisingSpeed ||
						599600000000,
					solarCruisingSpeed:
						warpEngines.components.isWarpEngines?.solarCruisingSpeed ||
						29980000,
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
				if (!system.components.isWarpEngines)
					throw new Error("System is not a warp engine");

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
			.autoPublish(["autopilot", "facingWaypoints"], (entity) => ({ shipId: entity.id }))

			.request(({ ctx, input }) => {
				const ship = ctx.ecs.getEntityById(input.shipId);
				const waypointId = ship?.components.autopilot?.destinationWaypointId;
				let destinationName = "";
				let waypoint: Entity | null | undefined;
				if (typeof waypointId === "number") {
					waypoint = ctx.flight?.ecs.getEntityById(waypointId);
					destinationName =
						waypoint?.components.identity?.name
							.replace(" Waypoint", "")
							.trim() || "";
				}
				const waypointParentId = waypoint?.components.position?.parentId;

				const waypointSystemPosition =
					typeof waypointParentId === "number"
						? ctx.flight?.ecs.getEntityById(waypointParentId)?.components
								.position || null
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
				if (!system.components.isThrusters)
					throw new Error("System is not thrusters");

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
					const ship = ctx.ecs.getEntityById(shipId);
					playShipSound(system, ship!, "thrust");
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
				if (!system.components.isThrusters)
					throw new Error("System is not thrusters");

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
					playShipSound(system, ship!, "thrust");
				}

				return { systemId, shipId, rotation };
			}),
	}),
	stream: t.procedure
		.input(z.object({ shipId: z.number(), systemId: z.number().nullable() }))
		.dataStream(({ ctx, input, entity }) => {
			if (!entity) return false;
			const ship = ctx.ecs.getEntityById(input.shipId);
			const systemId = input?.systemId || ship?.components.position?.parentId;
			if (typeof systemId === "undefined") {
				return false;
			}
			if (
				(entity.components.isImpulseEngines ||
					entity.components.isWarpEngines) &&
				ship?.components.shipSystems?.shipSystems.has(entity.id)
			) {
				return true;
			}
			return Boolean(
				entity.components.position &&
					entity.components.position.parentId === systemId,
			);
		}),
});
