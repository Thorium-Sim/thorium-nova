import { Quaternion, Vector3 } from "three";
import { type Entity, System } from "@thorium/utils/ecs";
import {
	getCompletePositionFromOrbit,
	getObjectSystem,
} from "@thorium/utils/starmap/position";
import {
	setShipAlert,
	clearShipAlert,
} from "@thorium/utils/.server/ship/shipAlertHelpers";
import {
	solarRadiusToKilometers,
	type SolarRadius,
} from "@thorium/utils/unitTypes";
import { COLLISION_WARNING_SECONDS } from "@thorium/ecs-components/shipAlerts";

const COLLISION_ALERT_ID = "collision";
const MIN_SPEED_THRESHOLD = 0.5; // km/s
// Reuse vectors/quaternion to avoid per-frame allocation
const shipPos = new Vector3();
const objectPos = new Vector3();
const forwardDir = new Vector3();
const toObject = new Vector3();

const rotationQuat = new Quaternion();
// Reusable set for walking the satellite hierarchy (single-threaded, cleared each call)
const ancestorIds = new Set<number>();

export class CollisionWarningSystem extends System {
	static flightMode = ["nova"];
	frequency = 5;

	test(entity: Entity) {
		return !!(
			entity.components.isPlayerShip &&
			entity.components.position &&
			entity.components.rotation &&
			entity.components.velocity &&
			entity.components.shipAlerts
		);
	}

	update(entity: Entity) {
		const { position, rotation, velocity, shipAlerts, autopilot } =
			entity.components;
		if (!position || !rotation || !velocity || !shipAlerts) return;

		// Skip if autopilot is handling navigation
		if (autopilot?.forwardAutopilot) {
			clearShipAlert(entity, COLLISION_ALERT_ID);
			return;
		}

		// Skip entities positioned inside another entity (docked shuttles, etc.)
		if (position.type === "ship") {
			clearShipAlert(entity, COLLISION_ALERT_ID);
			return;
		}

		// Walk UP: find the solar system this ship belongs to
		const shipSystem = getObjectSystem(entity);
		if (!shipSystem) {
			// Interstellar space — no collision candidates
			clearShipAlert(entity, COLLISION_ALERT_ID);
			return;
		}

		const currentSpeed = velocity.forwardVelocity;

		// Skip at very low speeds (thruster-only)
		if (currentSpeed < MIN_SPEED_THRESHOLD) {
			clearShipAlert(entity, COLLISION_ALERT_ID);
			return;
		}

		// Compute forward vector from ship's rotation
		rotationQuat.set(rotation.x, rotation.y, rotation.z, rotation.w);
		forwardDir.set(0, 0, 1).applyQuaternion(rotationQuat);

		// Compute cone height (detection range)
		const coneHeight = currentSpeed * COLLISION_WARNING_SECONDS;

		shipPos.set(position.x, position.y, position.z);

		// Ship bounding sphere radius (size is in meters, convert to km)
		const shipSize = entity.components.size;
		const shipRadiusKm = shipSize
			? Math.max(shipSize.length, shipSize.width, shipSize.height) / 2 / 1000
			: 0;

		let closestTTC = Number.POSITIVE_INFINITY;
		let closestId: number | null = null;
		let closestName = "";

		this.checkSolarCandidates(
			entity,
			shipSystem.id,
			shipPos,
			forwardDir,
			coneHeight,
			currentSpeed,
			shipRadiusKm,
			(id, name, ttc) => {
				if (ttc < closestTTC) {
					closestTTC = ttc;
					closestId = id;
					closestName = name;
				}
			},
		);

		// Determine if state has changed enough to publish
		const existingAlert = shipAlerts.alerts.find(
			(a: { id: string }) => a.id === COLLISION_ALERT_ID,
		);
		const prevObjectId =
			(existingAlert && "objectId" in existingAlert
				? existingAlert.objectId
				: null) ?? null;
		const prevTTC =
			(existingAlert && "timeToCollision" in existingAlert
				? existingAlert.timeToCollision
				: 0) ?? 0;

		const hasNewThreat = closestId !== null;
		const idChanged = closestId !== prevObjectId;
		const ttcShifted =
			hasNewThreat &&
			prevObjectId !== null &&
			Math.abs(closestTTC - prevTTC) > 0.5;

		if (hasNewThreat && (idChanged || ttcShifted)) {
			setShipAlert(entity, {
				id: COLLISION_ALERT_ID,
				type: "collision",
				priority: 10,
				message: `Collision Warning — ${closestName}`,
				objectId: closestId!,
				objectName: closestName,
				timeToCollision: closestTTC,
				baselineTimestamp: Date.now(),
			});
		} else if (!hasNewThreat && existingAlert) {
			clearShipAlert(entity, COLLISION_ALERT_ID);
		}
	}

	/**
	 * Walk DOWN from the solar system entity to find all satellite descendants
	 * (stars, planets, moons) and test each for collision.
	 *
	 * Iterates the satellite cache repeatedly to discover children at each
	 * level of the hierarchy until no new descendants are found.
	 */
	private checkSolarCandidates(
		entity: Entity,
		systemId: number,
		shipPosition: Vector3,
		forward: Vector3,
		coneHeight: number,
		currentSpeed: number,
		shipRadius: number,
		onCandidate: (id: number, name: string, ttc: number) => void,
	) {
		// TODO: Add collision checks for dynamic objects (ships, starbases, torpedoes)
		const satelliteCache = this.ecs.componentCache.get("satellite");
		if (!satelliteCache) return;

		ancestorIds.clear();
		ancestorIds.add(systemId);

		let foundNew = true;
		while (foundNew) {
			foundNew = false;
			for (const candidate of satelliteCache) {
				if (candidate.id === entity.id) continue;
				const parentId = candidate.components.satellite?.parentId;
				if (parentId == null || !ancestorIds.has(parentId)) continue;
				if (ancestorIds.has(candidate.id)) continue;

				ancestorIds.add(candidate.id);
				foundNew = true;

				this.testCandidate(
					candidate,
					shipPosition,
					forward,
					coneHeight,
					currentSpeed,
					shipRadius,
					onCandidate,
				);
			}
		}
	}

	private testCandidate(
		candidate: Entity,
		shipPosition: Vector3,
		forward: Vector3,
		coneHeight: number,
		currentSpeed: number,
		shipRadius: number,
		onCandidate: (id: number, name: string, ttc: number) => void,
	) {
		if (candidate.components.satellite) {
			objectPos.copy(getCompletePositionFromOrbit(candidate));
		} else if (candidate.components.position) {
			objectPos.set(
				candidate.components.position.x,
				candidate.components.position.y,
				candidate.components.position.z,
			);
		} else {
			return;
		}

		const radius = this.getCollisionRadius(candidate);

		// Broad-phase filter — skip objects clearly out of range or behind the ship
		toObject.subVectors(objectPos, shipPosition);
		const dist = toObject.length();
		if (dist - radius > coneHeight || dist < 0.0001) return;
		if (forward.dot(toObject) <= 0) return;

		this.testRaySphereCollision(
			candidate,
			shipPosition,
			forward,
			coneHeight,
			currentSpeed,
			objectPos,
			radius,
			shipRadius,
			onCandidate,
		);
	}

	private getCollisionRadius(candidate: Entity): number {
		if (candidate.components.isPlanet) {
			return candidate.components.isPlanet.radius;
		}
		if (candidate.components.isStar) {
			return solarRadiusToKilometers(
				candidate.components.isStar.radius as SolarRadius,
			);
		}
		if (candidate.components.size) {
			// Ships and starbases: size is in meters, convert to km
			return candidate.components.size.length / 2 / 1000;
		}
		return 0;
	}

	/**
	 * Ray-sphere intersection test. Checks whether the ship's forward
	 * trajectory passes within the combined radius (object + ship hull)
	 * of the candidate. TTC is based on surface-to-surface distance.
	 */
	private testRaySphereCollision(
		candidate: Entity,
		shipPosition: Vector3,
		forward: Vector3,
		coneHeight: number,
		currentSpeed: number,
		candidatePos: Vector3,
		objectRadius: number,
		shipRadius: number,
		onCandidate: (id: number, name: string, ttc: number) => void,
	) {
		toObject.subVectors(candidatePos, shipPosition);

		// Combined collision radius: object surface + ship hull
		const combinedRadius = objectRadius + shipRadius;

		// Project the ship→object vector onto the forward ray
		const along = forward.dot(toObject);

		// Object must be ahead of the ship and within detection range
		if (along < 0) return;
		if (along - combinedRadius > coneHeight) return;

		// Perpendicular distance from the ray to the object center
		// |toObject|² = along² + perp²
		const distSq = toObject.lengthSq();
		const perpDistSq = distSq - along * along;

		if (perpDistSq > combinedRadius * combinedRadius) return;

		// TTC based on distance along the ray to sphere entry point
		const entryDistance =
			along - Math.sqrt(combinedRadius * combinedRadius - perpDistSq);
		const ttc = Math.max(0, entryDistance) / currentSpeed;

		if (ttc <= COLLISION_WARNING_SECONDS) {
			const name = candidate.components.identity?.name || "Unknown Object";
			onCandidate(candidate.id, name, ttc);
		}
	}
}
