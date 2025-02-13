import { getPhaserCharge } from "@thorium/.server/systems/PhasersSystem";
import { efficiency } from "@thorium/ecs-components/efficiency";
import { getShipSystems } from "@thorium/utils/.server/ship/getShipSystem";
import { type ECS, type Entity, System } from "@thorium/utils/ecs";
import { getOrbitPosition } from "@thorium/utils/starmap/getOrbitPosition";
import type { KiloWattHour } from "@thorium/utils/unitTypes";

export class SensorScanSystem extends System {
	/** The number of concurrent sensor scans */
	sensorsScanCount = new Map<number, number>();
	test(entity: Entity) {
		return !!entity.components.scan;
	}
	preUpdate(_elapsed: number): void {
		this.sensorsScanCount.clear();
		// Each concurrent sensor scan decreases the total amount each scan progresses
		for (const scan of this.ecs.componentCache.get("scan") || []) {
			const parentId = scan.components.scan?.parentId;
			if (!scan.components.scan || !parentId) continue;
			if (scan.components.scan.progress >= 1) continue;
			if (!this.sensorsScanCount.has(parentId))
				this.sensorsScanCount.set(parentId, 0);
			this.sensorsScanCount.set(
				parentId,
				(this.sensorsScanCount.get(parentId) || 0) + 1,
			);
		}
	}
	update(entity: Entity, elapsedMs: number): void {
		const elapsedTimeHours = elapsedMs / 1000 / 60 / 60;
		const elapsedTimeSeconds = elapsedMs / 1000;
		const scan = entity.components.scan;
		if (!scan) return;
		if (scan.progress >= 1) {
			// Handle repeat scans
			if (scan.repeatInterval === null) this.ecs.removeEntity(entity);
			else {
				const intervalTime = scan.intervalTime + elapsedTimeSeconds;
				entity.updateComponent("scan", {
					intervalTime,
				});
				if (intervalTime > scan.repeatInterval) {
					entity.updateComponent("scan", {
						progress: 0,
					});
				}
			}

			return;
		}

		const parent = this.ecs.getEntityById(scan.parentId);
		const object = this.ecs.getEntityById(scan.target);
		if (
			!parent ||
			parent.components.isDestroyed ||
			!object ||
			object.components.isDestroyed
		)
			return;

		const allSensors = this.ecs.componentCache.get("isSensors");
		let sensors: Entity | null = null;
		for (const sensorEntity of allSensors || []) {
			if (sensorEntity.components.isShipSystem?.shipId === scan.parentId) {
				sensors = sensorEntity;
				break;
			}
		}
		const sensorSystem = sensors?.components.isSensors;
		if (!sensors || !sensorSystem) return;
		const scanCount = this.sensorsScanCount.get(sensors.id);
		if (!scanCount) return;

		const shipPosition = parent.components.position;
		const objectPosition = object.components.satellite
			? getOrbitPosition(object.components.satellite)
			: object.components.position;
		if (!shipPosition || !objectPosition) return;

		const distance = Math.hypot(
			shipPosition.x - objectPosition.x,
			shipPosition.y - objectPosition.y,
			shipPosition.z - objectPosition.z,
		);
		if (distance > sensorSystem.passiveRange) return;
		// Increase the scan progress
		const {
			activeRange,
			passiveRange,
			maxScanEnergyCost,
			minScanEnergyCost,
			shieldPenaltyMultiplier,
		} = sensorSystem;
		let totalRequiredEnergy: KiloWattHour = Number.POSITIVE_INFINITY;
		if (distance <= activeRange)
			totalRequiredEnergy =
				(maxScanEnergyCost - minScanEnergyCost) * (distance / activeRange) +
				minScanEnergyCost;
		else if (distance <= passiveRange) {
			const addedDistance = distance - activeRange;
			const distanceRatio = passiveRange / activeRange;
			// Exponential increase
			totalRequiredEnergy =
				maxScanEnergyCost + Math.E ** (addedDistance * distanceRatio) - 1;
		}

		// Multiply by the target's shields strength if shields are raised
		let shieldStrength = 0;
		let shieldStatus: "up" | "down" = "down";
		const shields = getShipSystems(this.ecs, {
			shipId: object.id,
			systemType: "Shields",
		});
		for (const sys of shields) {
			const shield = sys.components.isShields;
			if (!shield) continue;
			shieldStrength += shield.strength / shield.maxStrength / shields.length;
			shieldStatus = shield.state === "up" ? "up" : shieldStatus;
		}
		totalRequiredEnergy *= shieldStrength * shieldPenaltyMultiplier;

		const currentPower = sensors.components.power?.currentPower || 0;
		const powerProvided = currentPower / scanCount;
		// The energy provided in kilowatt hours, by converting from megawatts
		const energyProvided: KiloWattHour =
			powerProvided * elapsedTimeHours * 1000;

		const progress = energyProvided / totalRequiredEnergy;
		entity.updateComponent("scan", { progress });

		if (scan.progress >= 1) {
			// The scan is complete! Let's put some data in the database
			const currentResults = sensorSystem.resultsDatabase.get(object.id) || {};
			switch (scan.type) {
				case "cargo": {
					const output: Record<string, number> = {};
					object.components.shipMap?.deckNodes.forEach((node) => {
						if (node.isRoom && node.flags?.includes("cargo")) {
							Object.entries(node.contents).forEach(([name, { count }], i) => {
								if (count === 0) return;
								if (!output[name]) output[name] = 0;
								output[name] += count;
							});
						}
					});
					// All of the cargo on the target which has the "scanable" flag
					currentResults.cargo = output;
					break;
				}
				case "crew":
					// TODO February 12, 2025: We currently don't track crew at all, but we should add it to sensor scans once we do
					break;
				case "damage": {
					// We'll just include the top three damaged systems
					const systems: { name: string | undefined; efficiency: number }[] =
						[];
					for (const [systemId] of object.components.shipSystems?.shipSystems ||
						[]) {
						const system = this.ecs.getEntityById(systemId);
						if (!system) continue;
						systems.push({
							name:
								system?.components.identity?.name ||
								system.components.isShipSystem?.type,
							efficiency: system.components.efficiency?.efficiency || 1,
						});
					}
					systems.sort((a, b) => a.efficiency - b.efficiency);
					currentResults.damage = {};
					for (const { name, efficiency } of systems.slice(0, 3)) {
						if (!name) continue;
						currentResults.damage[name] = efficiency;
					}
					break;
				}
				case "iff": {
					const faction = this.ecs.getEntityById(
						object.components.faction?.factionId || -1,
					);

					currentResults.iff = {
						factionName: faction?.components.identity?.name || "Unknown",
					};
					break;
				}
				case "shields":
					currentResults.shields = {
						strength: shieldStrength,
						status: shieldStatus,
					};
					break;
				case "targeting": {
					const targeting = getShipSystems(this.ecs, {
						shipId: object.id,
						systemType: "Targeting",
					});
					const target = this.ecs.getEntityById(
						targeting[0].components.isTargeting?.target || -1,
					);
					currentResults.targeting = {
						targetName: target?.components.identity?.name || "None",
					};
					break;
				}
				case "weapons": {
					const phasers = getShipSystems(this.ecs, {
						shipId: object.id,
						systemType: "Phasers",
					});
					const torpedoes = getShipSystems(this.ecs, {
						shipId: object.id,
						systemType: "TorpedoLauncher",
					});

					currentResults.weapons = [
						...phasers.map((p) => {
							return { type: "phasers" as const, charge: getPhaserCharge(p) };
						}),
						...torpedoes.map((t) => {
							const torpedo = this.ecs.getEntityById(
								t.components.isTorpedoLauncher?.torpedoEntity || -1,
							);
							return {
								type: "torpedoes" as const,
								loaded:
									t.components.isTorpedoLauncher?.status === "loaded"
										? torpedo?.components.identity?.name || "Unknown"
										: "Unloaded",
							};
						}),
					];
					break;
				}
			}

			sensorSystem.resultsDatabase.set(object.id, currentResults);
			if (scan.repeatInterval === null) this.ecs.removeEntity(entity);
		}
	}
}
