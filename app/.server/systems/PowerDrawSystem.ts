import { getTargetIsInPhaserRange } from "@thorium/.server/systems/PhasersSystem";
import { getRoomBySystem } from "@thorium/cards/CargoControl/data.server";
import { type Entity, System } from "@thorium/utils/ecs";

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

		const { powerLevels } = power;
		const requiredPower = powerLevels[0];
		const maxSafePower = powerLevels.at(-1) || requiredPower;
		let powerDraw = requiredPower;
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
				const totalOutput = directionOutput + rotationOutput;
				powerDraw = (maxSafePower - requiredPower) * totalOutput + requiredPower;
				break;
			}
			case "shields": {
				if (!entity.components.isShields) return;
				const { strength, maxStrength, state, chargeRate } = entity.components.isShields;
				if (state === "down" || strength === maxStrength) {
					powerDraw = requiredPower;
				} else {
					powerDraw = requiredPower + (maxSafePower - requiredPower) * chargeRate;
				}
				break;
			}
			case "torpedoLauncher": {
				if (!entity.components.isTorpedoLauncher) return;
				const { status } = entity.components.isTorpedoLauncher;
				if (status === "loading" || status === "loaded") {
					powerDraw = power.powerLevels[0];
				} else if (status === "firing") {
					powerDraw = maxSafePower;
				}
				break;
			}
			case "phasers": {
				// Only draw power if the current target is in range
				if (!getTargetIsInPhaserRange(entity)) {
					powerDraw = 0;
					break;
				}
				const battery = this.ecs.getEntityById(power.batterySource || -1);
				const batteryOutput = battery?.components.isBattery?.outputRate || 0;
				powerDraw = batteryOutput * (entity.components.isPhasers?.firePercent || 0);

				break;
			}
			case "sensors": {
				// If there is an active scan, just draw the full amount of power
				for (const scan of this.ecs.componentCache.get("scan") || []) {
					if (scan.components.scan?.parentId === ship.id) {
						powerDraw = maxSafePower;
						break;
					}
				}
				break;
			}
			case "mainComputer": {
				// If there is an active scan, just draw the full amount of power
				for (const diagnostic of this.ecs.componentCache.get("diagnostic") || []) {
					if (diagnostic.components.diagnostic?.shipId === ship.id) {
						powerDraw = maxSafePower;
						break;
					}
				}
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
			case "exocomps": {
				const ship = this.ecs.getEntityById(entity.components.isShipSystem?.shipId || -1);
				if (!ship) return;
				const exocompRooms = getRoomBySystem(ship, "exocomps").map((i) => i.id);
				if (exocompRooms.length === 0) return;

				// Charge any exocomps that are in the same room as the exocomp system
				for (const exocomp of this.ecs.componentCache.get("exocomp") || []) {
					if (!exocomp.components.exocomp) continue;
					const { maxCharge, chargeRate, currentCharge } = exocomp.components.exocomp;
					// If node path is empty, then the entity is sitting in a room.
					if (
						exocompRooms.includes(exocomp.components.passengerMovement?.destinationNode || -1) &&
						exocomp.components.passengerMovement?.nodePath.length === 0
					) {
						if (currentCharge < maxCharge) {
							powerDraw += chargeRate;
						}
					}
				}
				powerDraw = Math.min(powerDraw, maxSafePower);
			}
			default:
				return;
		}

		entity.updateComponent("power", {
			powerDraw: powerDraw * efficiencyMultiple,
		});
	}
}
