import { pubsub } from "@thorium/.server/init/pubsub";
import { getMaxSpeedIndex } from "@thorium/cards/Legacy/EngineControl/getMaxSpeedIndex";
import { type Entity, System } from "@thorium/utils/ecs";

export class LegacyEngineHeatPowerSystem extends System {
	static flightMode = ["legacy"];
	test(entity: Entity) {
		return !!(
			entity.components.isWarpEngines || entity.components.isImpulseEngines
		);
	}
	update(entity: Entity, elapsed: number) {
		const elapsedRatio = elapsed / 1000;

		const engine =
			entity.components.isWarpEngines || entity.components.isImpulseEngines;
		const heat = entity.components.heat;
		const power = entity.components.power;
		const currentPower = power?.currentPower || 0;

		if (!engine) return;
		const speed =
			"currentWarpFactor" in engine
				? engine.currentWarpFactor
				: Math.trunc(
						(engine.targetSpeed / engine.cruisingSpeed) *
							(engine.speeds.length - 1),
					);

		const speedVal = speed || -4;
		if (heat && !entity.components.legacyCoolant?.cooling) {
			const newHeat = Math.min(
				heat.maxHeat,
				Math.max(
					heat.nominalHeat,
					heat.heat + speedVal * heat.legacyHeatRate * elapsedRatio,
				),
			);
			entity.updateComponent("heat", { heat: newHeat });
		}

		// Also adjust the speed if the power is too low
		if (power) {
			const maxIndex = getMaxSpeedIndex(power?.powerLevels || [], currentPower);
			const speedCount = engine.speeds.length || 0;
			if ("currentWarpFactor" in engine) {
				const maxWarpFactor = Math.trunc(
					Math.min(Math.max(0, maxIndex * speedCount)),
				);
				if (engine.currentWarpFactor > maxWarpFactor) {
					entity.updateComponent("isWarpEngines", {
						currentWarpFactor: maxWarpFactor,
					});
					pubsub.publish.legacy.engineControl.get({
						shipId: entity.components.isShipSystem?.shipId || -1,
					});
				}
			} else {
				const speedIncrement = engine.cruisingSpeed / (speedCount - 1);
				const speedIndex = maxIndex * speedCount;
				const speed = speedIncrement * speedIndex;
				if (engine.targetSpeed > speed) {
					entity.updateComponent("isImpulseEngines", {
						targetSpeed: speed,
					});
					pubsub.publish.legacy.engineControl.get({
						shipId: entity.components.isShipSystem?.shipId || -1,
					});
				}
			}
		}
	}
}
