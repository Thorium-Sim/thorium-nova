import { getTargetIsInPhaserRange } from "@thorium/.server/systems/PhasersSystem";
import { type Entity, System } from "@thorium/utils/ecs";

/**
 * There's a subtle distinction between powerDraw and requestedPower (powerSources.length)
 * - powerDraw is how much power the system is currently pulling based
 *   on it's current workload.
 * - requestedPower is an artificial limit placed by the crew that keeps
 *   the power draw at or below that limit.
 */

export class PowerDrawSystem extends System {
	static flightMode = ["nova"];
	test(entity: Entity) {
		return !!entity.components.power && !!entity.components.isShipSystem;
	}
	update(entity: Entity) {
		const systemType = entity.components.isShipSystem;
		const ship = entity.ecs?.getEntityById(systemType?.shipId || -1);
		if (!ship) return;

		const power = entity.components.power;
		const efficiency = entity.components.damage?.efficiency || 1;
		const efficiencyMultiple = 1 / efficiency;
		if (!systemType?.type || !power) return;

		const { powerLevels, powerSources } = power;
		const requiredPower = powerLevels[0];
		const maxSafePower = powerLevels[powerLevels.length - 1];
		const requestedPower = powerSources.length;
		let powerDraw = 0;
		switch (systemType.type) {
			case "warpEngines": {
				if (!entity.components.isWarpEngines) return;
				const { currentWarpFactor, speeds } = entity.components.isWarpEngines;
				// The highest warp factor is the destructive speed, so we don't count that one.
				const warpFactorCount = speeds.length - 1;
				if (currentWarpFactor === 0) break;
				const warpEngineUse = currentWarpFactor / warpFactorCount;
				powerDraw = (maxSafePower - requiredPower) * warpEngineUse + requiredPower;
				break;
			}
			case "impulseEngines": {
				if (!entity.components.isImpulseEngines) return;
				const { cruisingSpeed, targetSpeed } = entity.components.isImpulseEngines;
				// If we're going faster than the cruising speed,
				// draw as much power as possible
				if (targetSpeed > cruisingSpeed) {
					powerDraw = requestedPower;
					break;
				}
				if (targetSpeed === 0) break;
				// We divide the target speed in four, but we can't go below 1/4th
				// So we scale it where 0.25 is 0, and 1 is 1
				const impulseEngineUse = Math.max(0, (targetSpeed / cruisingSpeed - 0.25) * (4 / 3));
				powerDraw = (maxSafePower - requiredPower) * impulseEngineUse + requiredPower;

				break;
			}
			case "thrusters": {
				if (!entity.components.isThrusters) return;
				const { direction, rotationDelta } = entity.components.isThrusters;
				const directionOutput = Math.hypot(direction.x, direction.y, direction.z);
				const rotationOutput = Math.hypot(rotationDelta.x, rotationDelta.y, rotationDelta.z);
				const overloadPercent = Math.min(1, requestedPower / maxSafePower);
				const totalOutput = (directionOutput + rotationOutput) * overloadPercent;
				powerDraw = (maxSafePower - requiredPower) * totalOutput + requiredPower;
				break;
			}
			case "shields": {
				if (!entity.components.isShields) return;
				const { strength, maxStrength, state } = entity.components.isShields;
				if (state === "down") {
					powerDraw = 0;
				} else if (strength === maxStrength) {
					powerDraw = requiredPower;
				} else {
					powerDraw = requestedPower;
				}
				break;
			}
			case "torpedoLauncher": {
				if (!entity.components.isTorpedoLauncher) return;
				const { status } = entity.components.isTorpedoLauncher;
				if (status === "loading" || status === "loaded" || status === "firing") {
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
				powerDraw = power.powerSources.length * (entity.components.isPhasers?.firePercent || 0);

				break;
			}
			case "sensors": {
				// If there is an active scan, just draw the full amount of power
				let activeScans = false;
				for (const scan of this.ecs.componentCache.get("scan") || []) {
					if (scan.components.scan?.parentId === ship.id) activeScans = true;
					break;
				}
				powerDraw = Math.max(requiredPower, activeScans ? requestedPower : 0);
				break;
			}
			case "mainComputer": {
				// If there is an active scan, just draw the full amount of power
				let activeDiagnostic = false;
				for (const diagnostic of this.ecs.componentCache.get("diagnostic") || []) {
					if (diagnostic.components.diagnostic?.shipId === ship.id) activeDiagnostic = true;
					break;
				}
				powerDraw = Math.max(power.powerLevels[0], activeDiagnostic ? requestedPower : 0);
				break;
			}
			case "longRangeComm": {
				// Pretty much just the antenna gain affects power
				const gain = entity.components.isLongRangeComm?.antennaGain || 0;
				powerDraw = (maxSafePower - requiredPower) * gain + requiredPower;
				break;
			}
			case "shortRangeComm": {
				// Pretty much just the antenna gain affects power, but only when calling or connected
				if (["hailing", "connected"].includes(entity.components.isShortRangeComm?.state || "")) {
					const gain = entity.components.isShortRangeComm?.antennaGain || 0;
					powerDraw = (maxSafePower - requiredPower) * gain + requiredPower;
				}
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
