import type { ShipSystemTypes } from "@thorium/ecs-components/shipSystems";
import { getShipSystem } from "@thorium/utils/.server/ship/getShipSystem";
import { type ECS, Entity, System } from "@thorium/utils/ecs";
import type { scanTypes } from "@thorium/utils/flags/scanTypes";

export class NPCDecisionSystem extends System {
	test(entity: Entity) {
		return !!(
			entity.components.isShip && !entity.components.isPlayerShip?.value
		);
	}
	update(entity: Entity, _elapsedMs: number): void {
		const knowledge = entity.components.npcKnowledge;
		if (!knowledge) return;
		const { alertLevel = "5" } = knowledge;
		const combatReady = ["1", "2"].includes(alertLevel);

		// Decide what ships to scan, and what to scan
		npcScan(entity);

		const shields = getSystemsOfType(this.ecs, entity.id, "Shields");
		if (combatReady) {
			for (const shield of shields) {
				shield.updateComponent("isShields", {
					state: "up",
				});
			}

			// If there is a target, load the torpedoes and charge phasers
		} else {
			for (const shield of shields) {
				shield.updateComponent("isShields", {
					state: "down",
				});
			}
		}
	}
}

function getSystemsOfType(
	ecs: ECS,
	shipId: number,
	systemType: Capitalize<Exclude<ShipSystemTypes, "generic">>,
) {
	const systemEntities: Entity[] = [];
	for (const entity of ecs.componentCache.get(`is${systemType}`) || []) {
		if (entity.components.isShipSystem?.shipId === shipId) {
			systemEntities.push(entity);
			break;
		}
	}
	return systemEntities;
}

const CONCURRENT_SCANS = 3;
const SCAN_TIMEOUT = 1000 * 60; // 60 seconds before a ship's attribute can be scanned again
function npcScan(entity: Entity) {
	const sensors = getShipSystem(entity.ecs!, {
		systemType: "sensors",
		shipId: entity.id,
	});

	const activeScans = new Map<
		number,
		Set<(typeof scanTypes.options)[number]>
	>();
	let scanCount = 0;
	for (const scan of entity.ecs!.componentCache.get("scan") || []) {
		if (scan.components.scan?.parentId === entity.id) {
			const { target, type, progress } = scan.components.scan;
			if (progress >= 1) continue;
			if (!activeScans.has(target)) {
				activeScans.set(target, new Set());
			}
			activeScans.get(target)?.add(type);
			scanCount++;
		}
	}
	if (scanCount >= CONCURRENT_SCANS) return;

	const primaryScans = [
		"identification",
		"targeting",
		"weapons",
		"shields",
		"engines",
	];
	const secondaryScans = [
		"damage",
		"cargo",
		"crew",
		"lifeSupport",
		"communications",
		"temperature",
	];

	// Patrolling ships should prioritize scanning for illicit cargo
	if (entity.components.shipBehavior?.objective === "patrol") {
		primaryScans.splice(1, 0, "cargo");
		secondaryScans.slice(1, 1);
	}

	// We'll keep it simple and start by doing primary scans on the closest
	// ships. Once the closest ships are all scanned, we'll perform secondary
	// scans on all of them.
	const nearbyObjects = entity.components.nearbyObjects?.objects as Map<
		number,
		number
	>;
	if (!nearbyObjects) return;
	const objects = [...nearbyObjects.entries()].sort(([, a], [, b]) => a - b);

	// Do the same thing for secondary scans
	determineScan(primaryScans, entity, objects, sensors, scanCount);
	if (scanCount >= CONCURRENT_SCANS) return;
	determineScan(secondaryScans, entity, objects, sensors, scanCount);
}

function determineScan(
	scanList: string[],
	entity: Entity,
	objects: [number, number][],
	sensors: Entity,
	scanCount: number,
) {
	const scanResults = sensors.components.isSensors?.resultsDatabase;
	const activeRange = sensors.components.isSensors?.activeRange || 0;

	for (const [objectId, distance] of objects) {
		if (distance > activeRange) continue;
		const results = scanResults?.get(objectId);
		for (const t of scanList) {
			const type = t as keyof NonNullable<typeof results>;
			const typeResults = results?.[type];
			if (typeResults && typeResults.scanTime > Date.now() - SCAN_TIMEOUT)
				continue;
			// Create a new scan for this scan type
			const scanEntity = new Entity();
			scanEntity.addComponent("scan", {
				type,
				target: objectId,
				parentId: entity.id,
				progress: 0,
				timestamp: Date.now(),
			});
			entity.ecs?.addEntity(scanEntity);

			scanCount++;
			if (scanCount >= CONCURRENT_SCANS) break;
		}
	}
}
