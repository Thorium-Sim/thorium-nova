import type { ShipSystemTypes } from "@thorium/ecs-components/shipSystems";
import { getShipSystem } from "@thorium/utils/.server/ship/getShipSystem";
import { type ECS, Entity, System } from "@thorium/utils/ecs";
import type { scanTypes } from "@thorium/utils/flags/scanTypes";
import type { threatScores } from "@thorium/utils/flags/shipObjectives";
import { randomPointInSphere } from "@thorium/utils/operations/randomPointInSphere";
import { getTargetPoint } from "@thorium/utils/starmap/getTargetPoint";
import { pathfinder } from "@thorium/utils/starmap/pathfinder.server";
import { getObjectOffsetPosition } from "@thorium/utils/starmap/position";
import { Vector3 } from "three";
import type z from "zod";

const wanderVector = new Vector3();
const shipPosition = new Vector3();
const destinationVector = new Vector3();

// TODO April 4, 2025 Hard-coding this to weapons range.
const FLEE_DISTANCE = 25_000;
export class NPCDecisionSystem extends System {
	test(entity: Entity) {
		return !!(
			entity.components.isShip && !entity.components.isPlayerShip?.value
		);
	}
	update(entity: Entity, _elapsedMs: number): void {
		const knowledge = entity.components.npcKnowledge;
		const shipBehavior = entity.components.shipBehavior;
		if (!knowledge || !shipBehavior) return;
		const { patrolRadius, objective, action, actionTarget, behaviorTarget } =
			shipBehavior;

		// Decide what ships to scan, and what to scan
		npcScan(entity);
		let alertLevel = 5;
		const position = entity.components.position;

		const desiredPosition = {
			x: 0,
			y: 0,
			z: 0,
			...position,
		};

		function setMoveTowardsPosition(
			target?: Entity | null,
			distanceMultiplier = 1,
		) {
			if (target && position) {
				const offsetPosition = getObjectOffsetPosition(
					target,
					position,
					(entity.components.size?.length || 1) * distanceMultiplier,
				);
				desiredPosition.parentId = position.parentId;
				desiredPosition.x = offsetPosition.x;
				desiredPosition.y = offsetPosition.y;
				desiredPosition.z = offsetPosition.z;
			}
		}

		// Pick a ship to attack. If action is `null`, we're not in combat
		const { action: combatAction, targetId } = pickCombatAction(
			entity,
			knowledge.threats,
		);
		if (
			combatAction === "attack" ||
			objective === "attack" ||
			objective === "defend"
		) {
			if (typeof targetId === "number") {
				// TODO: April 1, 2025 Move into weapons range of the target
				const target = this.ecs.getEntityById(targetId);
				setMoveTowardsPosition(target);
				alertLevel = 1;
			} else {
				// TODO April 5, 2025: Figure out how to do formations
				const target =
					typeof behaviorTarget === "number"
						? this.ecs.getEntityById(behaviorTarget)
						: null;
				setMoveTowardsPosition(target);
				alertLevel = 3;
			}
		} else if (combatAction === "flee" || action === "flee") {
			alertLevel = 2;
			if (position) {
				const fleeDirection = calculateFleeDirection(entity, knowledge.threats);
				destinationVector
					.set(position.x, position.y, position.z)
					.addScaledVector(fleeDirection, FLEE_DISTANCE);
				desiredPosition.x = destinationVector.x;
				desiredPosition.y = destinationVector.y;
				desiredPosition.z = destinationVector.z;
			}
		} else if (objective === "avoid" || action === "avoid") {
			alertLevel = 3;
			if (position) {
				const fleeDirection = calculateFleeDirection(entity, knowledge.threats);
				destinationVector
					.set(position.x, position.y, position.z)
					.addScaledVector(fleeDirection, FLEE_DISTANCE);
				desiredPosition.x = destinationVector.x;
				desiredPosition.y = destinationVector.y;
				desiredPosition.z = destinationVector.z;
			}
		} else if (objective === "patrol" || action === "patrol") {
			alertLevel = 4;
			if (position) {
				shipPosition.set(position.x, position.y, position.z);
				if (typeof actionTarget === "object" && actionTarget) {
					destinationVector.set(actionTarget.x, actionTarget.y, actionTarget.z);
					wanderVector.copy(destinationVector);
				}
				if (
					!actionTarget ||
					typeof actionTarget === "number" ||
					shipPosition.distanceTo(destinationVector) < patrolRadius / 10
				) {
					const targetPoint = getTargetPoint(this.ecs, behaviorTarget);
					// Pick a new destination
					const [x, y, z] = randomPointInSphere(patrolRadius);
					wanderVector.set(x, y, z).add(targetPoint);

					entity.updateComponent("shipBehavior", {
						actionTarget: {
							parentId: desiredPosition.parentId!,
							x: wanderVector.x,
							y: wanderVector.y,
							z: wanderVector.z,
						},
					});
				}
				desiredPosition.x = wanderVector.x;
				desiredPosition.y = wanderVector.y;
				desiredPosition.z = wanderVector.z;
			}
		} else if (objective === "follow" || action === "follow") {
			const target =
				typeof behaviorTarget === "number"
					? this.ecs.getEntityById(behaviorTarget)
					: null;
			setMoveTowardsPosition(target);
		} else if (action === "dock" || action === "moveTo") {
			const target =
				typeof behaviorTarget === "number"
					? this.ecs.getEntityById(behaviorTarget)
					: null;
			setMoveTowardsPosition(target);
		} else if (action === "scan") {
			const target =
				typeof behaviorTarget === "number"
					? this.ecs.getEntityById(behaviorTarget)
					: null;
			setMoveTowardsPosition(target, 5);
		}

		let path: { x: number; y: number; z: number }[] = [];
		if (
			typeof actionTarget === "object" &&
			desiredPosition.parentId === actionTarget?.parentId &&
			desiredPosition.parentId
		) {
			path = pathfinder(entity, wanderVector) || [];
		}
		const nextCoordinates = path.shift();
		entity.updateComponent("autopilot", {
			rotationAutopilot: true,
			forwardAutopilot: true,
			desiredCoordinates: desiredPosition
				? {
						x: desiredPosition.x,
						y: desiredPosition.y,
						z: desiredPosition.z,
					}
				: null,
			desiredRotation: null,
			path,
			nextCoordinates,
			desiredSolarSystemId: position?.parentId || null,
		});

		const shields = getSystemsOfType(this.ecs, entity.id, "Shields");
		if (alertLevel <= 3) {
			for (const shield of shields) {
				shield.updateComponent("isShields", {
					state: "up",
				});
			}
		} else {
			for (const shield of shields) {
				shield.updateComponent("isShields", {
					state: "down",
				});
			}
		}

		if (alertLevel <= 2) {
			// Charge the phasers, load the torpedoes
		}
	}
}

const PREDICTION_TIME_SECONDS = 3;
const fleeVector = new Vector3();
const threatPosition = new Vector3();
const threatVelocity = new Vector3();
const predictedPosition = new Vector3();
/** Calculate the best direction to flee from the threats */
function calculateFleeDirection(
	entity: Entity,
	threats: Map<number, { score: number }>,
) {
	// TODO April 4, 2025 - This just flees from the biggest threat,
	// though it would be better to flee from the biggest concentration
	// of threats.
	let targetThreat: [threatId: number, score: number] | null = null;
	for (const [threat, scores] of threats) {
		if (!targetThreat) {
			targetThreat = [threat, scores.score];
			continue;
		}
		if (scores.score > targetThreat[1]) targetThreat = [threat, scores.score];
	}

	if (!targetThreat) return fleeVector.set(0, 0, 0);

	const position = entity.components.position;
	if (!position) return fleeVector.set(0, 0, 0);

	shipPosition.set(position.x, position.y, position.z);
	// Get the velocity of the highest threat
	const threat = entity.ecs?.getEntityById(targetThreat[0]);
	if (!threat || !threat.components.position) return fleeVector.set(0, 0, 0);
	threatPosition.set(
		threat?.components.position?.x || 0,
		threat?.components.position?.y || 0,
		threat?.components.position?.z || 0,
	);
	threatVelocity.set(
		threat?.components.velocity?.x || 0,
		threat?.components.velocity?.y || 0,
		threat?.components.velocity?.z || 0,
	);

	const predictedPursuerPosition = predictedPosition
		.copy(threatPosition)
		.addScaledVector(threatVelocity, PREDICTION_TIME_SECONDS);

	fleeVector.subVectors(shipPosition, predictedPursuerPosition).normalize();
	// TODO April 4, 2025 - Figure out how to add some kind of zig zag evasive maneuvering,
	// perhaps by adding a perpendicular force by adding sine waves together

	return fleeVector;
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

function pickCombatAction(
	entity: Entity,
	threats: Map<number, z.infer<typeof threatScores>>,
) {
	if (entity.components.shipBehavior?.objective === "attack") {
		return {
			action: "attack",
			targetId: entity.components.shipBehavior.behaviorTarget,
		};
	}

	// Always defend the target. Address threats that are targeting the target
	if (entity.components.shipBehavior?.objective === "defend") {
		const defendTarget = entity.components.shipBehavior.behaviorTarget;
		const defenseThreats: [number, number][] = [];
		for (const [threat, scores] of threats) {
			if (defendTarget === scores.targetId) {
				defenseThreats.push([threat, scores.score]);
			}
		}
		const threat = defenseThreats.sort(([, a], [, b]) => b - a)[0];
		if (threat) {
			return { action: "attack", targetId: threat[0] };
		}
	}

	// Flee if hull is less than 50%
	const hull = entity.components.hull;
	if (hull) {
		if (hull.hull < hull.maxHull / 2) {
			return { action: "flee" };
		}
	}

	if (entity.components.shipBehavior?.objective === "patrol") {
		// Dad helped Daisy write this line of code on April 1, 2025 🌼
		const faction = entity.ecs?.getEntityById(
			entity.components.faction?.factionId || -1,
		);

		const aggression = faction?.components.isFaction?.aggressiveness || 0.5;

		// Now we can actually pick a target
		// We'll filter the threat list by scores greater than 1 - aggression
		// and pick the one that is the highest threat
		const targetThreats: [number, number, number][] = [];
		for (const [threat, scores] of threats) {
			if (scores.score >= 1 - aggression) {
				targetThreats.push([threat, scores.score, scores.factionMultiplier]);
			}
		}
		const threat = targetThreats.sort(([, a, aa], [, b, bb]) =>
			b === a ? bb - aa : b - a,
		)[0];
		if (threat) {
			return { action: "attack", targetId: threat[0] };
		}
	}

	// Nothing to do, follow the objective
	return { action: null };
}
