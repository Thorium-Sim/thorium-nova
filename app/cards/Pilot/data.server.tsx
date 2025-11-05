import { t } from "@thorium/.server/init/t";
import { pubsub } from "@thorium/.server/init/pubsub";
import { getShipSystem } from "@thorium/utils/.server/ship/getShipSystem";
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

				system.updateComponent("isImpulseEngines", {
					targetSpeed: speed,
				});

				pubsub.publish.pilot.impulseEngines.get({
					shipId,
					systemId: system.id,
				});
				return system;
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

				system.updateComponent("isWarpEngines", {
					currentWarpFactor: factor,
				});

				pubsub.publish.pilot.warpEngines.get({
					shipId,
					systemId: system.id,
				});
				return system;
			}),
	}),
	autopilot: t.router({
		get: t.procedure
			.input(z.object({ shipId: z.number() }))

			.filter((publish: { shipId: number }, { input }) => {
				if (publish && publish.shipId !== input.shipId) return false;
				return true;
			})
			.autoPublish(["autopilot"], (entity) => ({ shipId: entity.id }))

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
					destinationPosition: waypoint?.components.position || null,
					destinationSystemPosition: waypointSystemPosition,
					locked: !!ship?.components.autopilot?.desiredCoordinates,
				};
			}),
		lockCourse: t.procedure
			.input(z.object({ waypointId: z.number(), shipId: z.number() }))
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
			}),
		unlockCourse: t.procedure
			.input(z.object({ shipId: z.number() }))
			.send(({ ctx, input }) => {
				const ship = ctx.ecs.getEntityById(input.shipId);
				ship?.updateComponent("autopilot", {
					destinationWaypointId: null,
					desiredCoordinates: undefined,
					desiredRotation: null,
					desiredSolarSystemId: undefined,
					path: [],
					nextCoordinates: null,
					rotationAutopilot: false,
					forwardAutopilot: false,
				});

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
			}),
		activate: t.procedure
			.input(z.object({ shipId: z.number() }))
			.send(({ ctx, input }) => {
				const ship = ctx.ecs.getEntityById(input.shipId);

				ship?.updateComponent("autopilot", {
					forwardAutopilot: true,
				});
				pubsub.publish.pilot.autopilot.get({ shipId: input.shipId });
				pubsub.publish.starmapCore.autopilot({
					systemId: ship?.components.position?.parentId || null,
				});
			}),
		deactivate: t.procedure
			.input(z.object({ shipId: z.number() }))
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
			}),
	}),
	thrusters: t.router({
		setDirection: t.procedure
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
					const ship = ctx.ecs.getEntityById(shipId);
					playShipSound(system, ship!, "thrust");
				}

				// TODO: September 21 2022 - Deactivate the ships autopilot when the thruster rotation change
				return system;
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
