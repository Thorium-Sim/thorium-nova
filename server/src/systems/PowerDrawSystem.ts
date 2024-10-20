import { getTargetIsInPhaserRange } from "@server/systems/PhasersSystem";
import { type Entity, System } from "../utils/ecs";

/**
 * There's a subtle distinction between powerDraw and requestedPower (powerSources.length)
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
		const ship = entity.ecs?.getEntityById(systemType?.shipId || -1);
		if (!ship) return;

		const power = entity.components.power;
		const efficiency = entity.components.efficiency?.efficiency || 1;
		const efficiencyMultiple = 1 / efficiency;
		if (!systemType?.type || !power) return;

		const { maxSafePower, requiredPower, powerSources } = power;
		const requestedPower = powerSources.length;
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
					powerDraw = requestedPower;
					break;
				}
				if (targetSpeed === 0) break;
				// We divide the target speed in four, but we can't go below 1/4th
				// So we scale it where 0.25 is 0, and 1 is 1
				const impulseEngineUse = (targetSpeed / cruisingSpeed - 0.25) * (4 / 3);
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
				const overloadPercent = Math.min(1, requestedPower / maxSafePower);
				const totalOutput =
					(directionOutput + rotationOutput) * overloadPercent;
				powerDraw =
					(maxSafePower - requiredPower) * totalOutput + requiredPower;
				break;
			}
			case "shields": {
				if (!entity.components.isShields) return;
				const { strength, maxStrength, state } = entity.components.isShields;
				if (state === "down") {
					powerDraw = 0;
				} else if (strength === maxStrength) {
					powerDraw = power.requiredPower;
				} else {
					powerDraw = requestedPower;
				}
				break;
			}
			case "torpedoLauncher": {
				if (!entity.components.isTorpedoLauncher) return;
				const { status } = entity.components.isTorpedoLauncher;
				if (
					status === "loading" ||
					status === "loaded" ||
					status === "firing"
				) {
					powerDraw = requestedPower;
				} else {
					powerDraw = 0;
				}
				break;
			}
			case "phasers": {
				// Only draw power if the current target is in range
				if (!getTargetIsInPhaserRange(entity)) {
					powerDraw = 0;
					break;
				}
				powerDraw =
					power.powerSources.length *
					(entity.components.isPhasers?.firePercent || 0);

				break;
			}

			case "generic":
				powerDraw = requestedPower;
				break;
			default:
				return;
		}

		entity.updateComponent("power", {
			powerDraw: powerDraw * efficiencyMultiple,
		});
	}
}
