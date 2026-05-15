import { pubsub } from "@thorium/.server/init/pubsub";
import { t } from "@thorium/.server/init/t";
import { getMaxSpeedIndex } from "@thorium/cards/Legacy/EngineControl/getMaxSpeedIndex";
import { getShipSystem } from "@thorium/utils/.server/ship/getShipSystem";
import { shipPubsubFilter } from "@thorium/utils/.server/shipPubsubFilter";
import z from "zod";

export const engineControl = t.router({
	get: t.procedure
		.input(z.object({ shipId: z.number() }))
		.filter(shipPubsubFilter)
		.autoPublish(
			["isWarpEngines", "isImpulseEngines"],
			(entity) =>
				entity.components.isShipSystem && {
					shipId: entity.components.isShipSystem?.shipId,
				},
		)
		.request(({ ctx, input }) => {
			const warpEngines = getShipSystem(ctx.ecs, {
				systemType: "warpEngines",
				shipId: input.shipId,
			});
			const impulseEngines = getShipSystem(ctx.ecs, {
				systemType: "impulseEngines",
				shipId: input.shipId,
			});
			return {
				warpEngines: warpEngines?.components.isWarpEngines
					? {
							id: warpEngines.id,
							name: warpEngines.components.identity?.name || "Warp Engines",
							currentWarpFactor: warpEngines.components.isWarpEngines.currentWarpFactor,
							speeds: warpEngines.components.isWarpEngines.speeds,
							nominalHeat: warpEngines.components.heat?.nominalHeat,
							maxHeat: warpEngines.components.heat?.maxHeat,
						}
					: null,
				impulseEngines: impulseEngines?.components.isImpulseEngines
					? {
							id: impulseEngines.id,
							name: impulseEngines.components.identity?.name || "Impulse Engines",
							speeds: impulseEngines.components.isImpulseEngines.speeds,
							currentSpeed: impulseEngines.components.isImpulseEngines.targetSpeed,
							cruisingSpeed: impulseEngines.components.isImpulseEngines.cruisingSpeed,
							nominalHeat: impulseEngines.components.heat?.nominalHeat,
							maxHeat: impulseEngines.components.heat?.maxHeat,
						}
					: null,
			};
		}),
	setSpeed: t.procedure
		.input(
			z.object({
				shipId: z.number(),
				impulseSpeedIndex: z.number().optional(),
				warpSpeedIndex: z.number().optional(),
			}),
		)
		.send(({ ctx, input }) => {
			const warpEngine = getShipSystem(ctx.ecs, {
				shipId: input.shipId,
				systemType: "warpEngines",
			});
			const impulseEngine = getShipSystem(ctx.ecs, {
				shipId: input.shipId,
				systemType: "impulseEngines",
			});
			if (typeof input.impulseSpeedIndex === "number") {
				warpEngine?.updateComponent("isWarpEngines", {
					currentWarpFactor: 0,
				});
				const speedCount = impulseEngine.components.isImpulseEngines?.speeds.length || 2;
				const power = impulseEngine.components.power;
				const currentPower = power?.currentPower || 0;
				const maxIndex = getMaxSpeedIndex(power?.powerLevels || [], currentPower);
				if (maxIndex < 0) {
					impulseEngine?.updateComponent("isImpulseEngines", {
						targetSpeed: 0,
					});
				} else {
					const speedIncrement =
						(impulseEngine.components.isImpulseEngines?.cruisingSpeed || 0) / (speedCount - 1);

					const speedIndex = Math.min(maxIndex * speedCount, input.impulseSpeedIndex + 1);
					const speed = speedIncrement * speedIndex;
					impulseEngine?.updateComponent("isImpulseEngines", {
						targetSpeed: speed,
					});
				}
			} else if (typeof input.warpSpeedIndex === "number") {
				const power = warpEngine.components.power;
				const currentPower = power?.currentPower || 0;
				const speedCount = warpEngine.components.isWarpEngines?.speeds.length || 0;
				const maxIndex = getMaxSpeedIndex(power?.powerLevels || [], currentPower);
				warpEngine?.updateComponent("isWarpEngines", {
					currentWarpFactor: Math.trunc(
						Math.min(Math.max(0, maxIndex * speedCount), input.warpSpeedIndex),
					),
				});
				impulseEngine?.updateComponent("isImpulseEngines", {
					targetSpeed: 0,
				});
			} else {
				// Full Stop
				warpEngine?.updateComponent("isWarpEngines", {
					currentWarpFactor: 0,
				});
				impulseEngine?.updateComponent("isImpulseEngines", {
					targetSpeed: 0,
				});
			}

			pubsub.publish.legacy.engineControl.get({ shipId: input.shipId });
		}),
});
