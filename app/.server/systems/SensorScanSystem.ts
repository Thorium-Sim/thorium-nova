import { pubsub } from "@thorium/.server/init/pubsub";
import { getPhaserCharge } from "@thorium/.server/systems/PhasersSystem";
import { getClassification } from "@thorium/cards/Navigation/getObjectClassification.server";
import { getShipSystems } from "@thorium/utils/.server/ship/getShipSystem";
import { type ECS, type Entity, System } from "@thorium/utils/ecs";
import type { scanRecord, scanTypes } from "@thorium/utils/flags/scanTypes";
import { getOrbitPosition } from "@thorium/utils/starmap/getOrbitPosition";
import type { KiloWattHour } from "@thorium/utils/unitTypes";
import { capitalCase } from "change-case";
import type { z } from "zod";

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

		const allSensors = this.ecs.componentCache.get("isSensors");
		let sensors: Entity | null = null;
		for (const sensorEntity of allSensors || []) {
			if (sensorEntity.components.isShipSystem?.shipId === scan.parentId) {
				sensors = sensorEntity;
				break;
			}
		}
		const sensorSystem = sensors?.components.isSensors;
		const shipId = sensors?.components.isShipSystem?.shipId;

		if (scan.progress >= 1) {
			// Handle repeat scans
			if (scan.repeatInterval === null) {
				const ship = this.ecs.getEntityById(shipId || -1);
				if (!ship?.components.isPlayerShip) {
					// Remove scan entities from NPC ships
					this.ecs.removeEntity(entity);
				}
				return;
			}
			const intervalTime = scan.intervalTime + elapsedTimeSeconds;
			entity.updateComponent("scan", {
				intervalTime,
			});
			if (intervalTime > scan.repeatInterval) {
				entity.updateComponent("scan", {
					progress: 0,
				});
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

		if (!sensors || !sensorSystem || !shipId) return;
		const scanCount = this.sensorsScanCount.get(shipId);
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
		// This part needs optimization
		const {
			activeRange,
			passiveRange,
			maxScanEnergyCost,
			minScanEnergyCost,
			shieldPenaltyMultiplier,
		} = sensorSystem;

		let totalRequiredEnergy: KiloWattHour = Number.POSITIVE_INFINITY;
		totalRequiredEnergy =
			(maxScanEnergyCost - minScanEnergyCost) * (distance / activeRange) +
			minScanEnergyCost;
		if (distance > activeRange) {
			const addedDistance = distance - activeRange;
			const distanceRatio = (passiveRange + addedDistance) / distance;
			// Quadratic increase
			totalRequiredEnergy *= distanceRatio;
		}
		if (distance > passiveRange) {
			totalRequiredEnergy = Number.POSITIVE_INFINITY;
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
		totalRequiredEnergy *= 1 + shieldStrength * shieldPenaltyMultiplier;

		// Fudge it for non-player ships
		const currentPower =
			(parent.components.isPlayerShip
				? sensors.components.power?.currentPower
				: sensors.components.power?.defaultPower) || 0;
		const powerProvided = currentPower / scanCount;
		// The energy provided in kilowatt hours, by converting from megawatts
		const energyProvided: KiloWattHour =
			powerProvided * elapsedTimeHours * 1000;

		const progress = Math.min(
			1,
			scan.progress + energyProvided / (totalRequiredEnergy || Number.EPSILON),
		);
		entity.updateComponent("scan", { progress });
		// End Optimization Part

		if (scan.progress >= 1) {
			// The scan is complete! Let's put some data in the database
			entity.updateComponent("scan", { timestamp: Date.now() });

			const currentResults = {
				...(sensorSystem.resultsDatabase.get(object.id) ||
					({} as z.infer<typeof scanRecord>)),
				...generateScanResults(object, this.ecs, scan.type),
			};

			// If it's not a player ship, delete the scan entity. We don't need to hang on to it.
			if (!parent.components.isPlayerShip) {
				this.ecs.removeEntity(entity);
			}
			sensorSystem.resultsDatabase.set(object.id, currentResults);
			pubsub.publish.sensors.scanResult({ shipId, objectId: object.id });
			pubsub.publish.sensors.scans({ shipId });
		}
	}
}

export function generateScanResults(
	object: Entity,
	ecs: ECS,
	scanType: z.infer<typeof scanTypes>,
) {
	const currentResults: Partial<z.infer<typeof scanRecord>> = {};
	switch (scanType) {
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
			currentResults.cargo = { cargo: output, scanTime: Date.now() };
			break;
		}
		case "crew":
			// TODO February 12, 2025: We currently don't track crew at all, but we should add it to sensor scans once we do
			currentResults.crew = { count: 0, scanTime: Date.now() };
			break;
		case "damage": {
			// We'll just include the top three damaged systems
			const systems: { name: string | undefined; efficiency: number }[] = [];
			for (const [systemId] of object.components.shipSystems?.shipSystems ||
				[]) {
				const system = ecs.getEntityById(systemId);
				if (!system) continue;
				const efficiency = system.components.damage?.efficiency || 1;
				if (efficiency > 0.9) continue;
				systems.push({
					name:
						system?.components.identity?.name ||
						system.components.isShipSystem?.type,
					efficiency,
				});
			}
			systems.sort((a, b) => a.efficiency - b.efficiency);
			const damage: Record<string, number> = {};
			for (const { name, efficiency } of systems.slice(0, 3)) {
				if (!name) continue;
				damage[name] = efficiency;
			}
			currentResults.damage = { scanTime: Date.now(), damage };
			break;
		}
		case "identification": {
			const faction = ecs.getEntityById(
				object.components.faction?.factionId || -1,
			);

			currentResults.identification = {
				scanTime: Date.now(),
				name: object.components.identity?.name || "Unknown",
				classification: getClassification(object) || "Unknown",
				factionName: faction?.components.identity?.name || "Unknown",
				image: {
					type: object.components.isShip
						? "ship"
						: object.components.isPlanet
							? "planet"
							: object.components.isStar
								? "star"
								: object.components.isSolarSystem
									? "solarSystem"
									: "unknown",
					vanity: object.components.isShip?.assets.vanity,
					hue: object.components.isStar?.hue,
					isWhite: object.components.isStar?.isWhite,
					cloudMapAsset: object.components.isPlanet?.cloudMapAsset,
					ringMapAsset: object.components.isPlanet?.ringMapAsset,
					textureMapAsset: object.components.isPlanet?.textureMapAsset,
				},
			};
			break;
		}
		case "shields": {
			let shieldStrength = 0;
			let shieldStatus: "up" | "down" = "down";
			const shields = getShipSystems(ecs, {
				shipId: object.id,
				systemType: "Shields",
			});
			for (const sys of shields) {
				const shield = sys.components.isShields;
				if (!shield) continue;
				shieldStrength += shield.strength / shield.maxStrength / shields.length;
				shieldStatus = shield.state === "up" ? "up" : shieldStatus;
			}

			currentResults.shields = {
				scanTime: Date.now(),
				strength: shieldStrength,
				status: shieldStatus,
			};
			break;
		}
		case "targeting": {
			const targeting = getShipSystems(ecs, {
				shipId: object.id,
				systemType: "Targeting",
			});
			const target = ecs.getEntityById(
				targeting[0].components.isTargeting?.target || -1,
			);
			currentResults.targeting = {
				scanTime: Date.now(),
				targetId: target?.id || -1,
				targetName: target?.components.identity?.name || "None",
				// TODO February 18, 2025 - Add proper support for this once we have individual weapons targeting
				targetedSystem: "General",
			};
			break;
		}
		case "weapons": {
			const phasers = getShipSystems(ecs, {
				shipId: object.id,
				systemType: "Phasers",
			});
			const torpedoes = getShipSystems(ecs, {
				shipId: object.id,
				systemType: "TorpedoLauncher",
			});

			currentResults.weapons = {
				scanTime: Date.now(),
				weapons: [
					...phasers.map((p) => {
						return { type: "phasers" as const, charge: getPhaserCharge(p) };
					}),
					...torpedoes.map((t) => {
						const torpedo = ecs.getEntityById(
							t.components.isTorpedoLauncher?.torpedoEntity || -1,
						);
						return {
							type: "torpedoes" as const,
							loaded:
								t.components.isTorpedoLauncher?.status === "loaded"
									? `${capitalCase(
											torpedo?.components.identity?.name || "Unknown",
										)} Loaded`
									: "Unloaded",
						};
					}),
				],
			};
			break;
		}
		case "engines": {
			// TODO March 31: Implement
			currentResults.engines = {
				scanTime: Date.now(),
				forwardSpeed: 0,
				turnSpeed: 0,
			};
			break;
		}
		case "communications": {
			// TODO March 31: Implement
			currentResults.communications = {
				scanTime: Date.now(),
			};
			break;
		}
		case "lifeSupport": {
			// TODO March 31: Implement
			currentResults.lifeSupport = {
				scanTime: Date.now(),
			};
			break;
		}
		case "life": {
			currentResults.life = {
				scanTime: Date.now(),
				isHabitable: object.components.isPlanet?.isHabitable || false,
				lifeforms: object.components.isPlanet?.lifeforms || ["None"],
				population: object.components.population?.count || 0,
			};
			break;
		}
		case "atmosphere":
			{
				currentResults.atmosphere = {
					scanTime: Date.now(),
					atmosphere: [
						...(object.components.isPlanet?.atmosphericComposition || []),
					],
				};
			}
			break;
		case "temperature": {
			// TODO March 1, 2025: Figure out a way to calculate this based on the aggregate
			// heat of all systems on the ship
			if (object.components.temperature?.temperature) {
				currentResults.temperature = {
					scanTime: Date.now(),
					temperature: object.components.temperature?.temperature,
				};
			}
		}
	}

	return currentResults;
}
