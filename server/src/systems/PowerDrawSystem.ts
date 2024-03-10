import { type Entity, System } from "../utils/ecs";

/**
 * There's a subtle distinction between powerDraw and requestedPower
 * - powerDraw is how much power the system is currently pulling based
 *   on it's current workload.
 * - requestedPower is an artificial limit placed by the crew that keeps
 *   the power draw at or below that limit.
 */

export class PowerDrawSystem extends System {
	test(entity: Entity) {
		return !!entity.components.power && !!entity.components.isShipSystem;
	}
	update(entity: Entity) {
		const systemType = entity.components.isShipSystem;
		const power = entity.components.power;
		const efficiency = entity.components.efficiency?.efficiency || 1;
		const efficiencyMultiple = 1 / efficiency;
		if (!systemType?.type || !power) return;
		const { maxSafePower, requiredPower } = power;
		let powerDraw = 0;
		switch (systemType.type) {
			case "warpEngines": {
				if (!entity.components.isWarpEngines) return;
				const { currentWarpFactor, warpFactorCount } =
					entity.components.isWarpEngines;
				if (currentWarpFactor === 0) break;
				const warpEngineUse = currentWarpFactor / warpFactorCount;
				powerDraw =
					(maxSafePower - requiredPower) * warpEngineUse + requiredPower;
				break;
			}
			case "impulseEngines": {
				if (!entity.components.isImpulseEngines) return;
				const { cruisingSpeed, targetSpeed } =
					entity.components.isImpulseEngines;
				// If we're going faster than the cruising speed,
				// draw as much power as possible
				if (targetSpeed > cruisingSpeed) {
					powerDraw = power.requestedPower;
					break;
				}
				if (targetSpeed === 0) break;
				const impulseEngineUse = targetSpeed / cruisingSpeed;
				powerDraw =
					(maxSafePower - requiredPower) * impulseEngineUse + requiredPower;

				break;
			}
			case "thrusters": {
				if (!entity.components.isThrusters) return;
				const { direction, rotationDelta, thrusting } =
					entity.components.isThrusters;
				const directionOutput = Math.hypot(
					direction.x,
					direction.y,
					direction.z,
				);
				const rotationOutput = Math.hypot(
					rotationDelta.x,
					rotationDelta.y,
					rotationDelta.z,
				);
				const overloadPercent = Math.min(
					1,
					power.requestedPower / maxSafePower,
				);
				const totalOutput =
					(directionOutput + rotationOutput) * overloadPercent;
				powerDraw =
					(maxSafePower - requiredPower) * totalOutput + requiredPower;
				break;
			}
			case "generic":
				powerDraw = power.requestedPower;
				break;
			default:
				return;
		}

		// Limit the power draw to the requested power, so we never go over it.
		entity.updateComponent("power", {
			powerDraw: Math.min(power.requestedPower, powerDraw * efficiencyMultiple),
		});
	}
}
