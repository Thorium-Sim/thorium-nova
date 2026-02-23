import { Quaternion, Vector3 } from "three";
import { type Entity, System } from "@thorium/utils/ecs";
import { pubsub } from "@thorium/.server/init/pubsub";
import {
	getCompletePositionFromOrbit,
	getObjectSystem,
} from "@thorium/utils/starmap/position";
import { getShipSystem } from "@thorium/utils/.server/ship/getShipSystem";
import {
	kilometerToLightMinute,
	solarRadiusToKilometers,
	type SolarRadius,
} from "@thorium/utils/unitTypes";

const MIN_SPEED_THRESHOLD = 0.5; // km/s
const COLLISION_WARNING_SECONDS = 20;
// Broad-phase cone filter — skip objects clearly off to the side before
// doing the more expensive ray-sphere intersection test.
const CONE_COS_HALF_ANGLE = Math.cos((22.5 * Math.PI) / 180); // ~0.924

// Reuse vectors/quaternion to avoid per-frame allocation
const shipPos = new Vector3();
const objectPos = new Vector3();
const forwardDir = new Vector3();
const toObject = new Vector3();

const rotationQuat = new Quaternion();

export class CollisionWarningSystem extends System {
	static flightMode = ["nova"];
	frequency = 5;

	test(entity: Entity) {
		return !!(
			entity.components.isPlayerShip &&
			entity.components.position &&
			entity.components.rotation &&
			entity.components.velocity &&
			entity.components.collisionWarning
		);
	}

	update(entity: Entity) {
		const { position, rotation, velocity, collisionWarning, autopilot } =
			entity.components;
		if (!position || !rotation || !velocity || !collisionWarning) return;

		// Skip if autopilot is handling navigation
		if (autopilot?.forwardAutopilot) {
			if (collisionWarning.objectId !== null) {
				entity.updateComponent("collisionWarning", {
					objectId: null,
					timeToCollision: 0,
					objectName: "",
				});
				pubsub.publish.pilot.collisionWarning.get({ shipId: entity.id });
			}
			return;
		}

		const currentSpeed = velocity.forwardVelocity;

		// Skip at very low speeds (thruster-only)
		if (currentSpeed < MIN_SPEED_THRESHOLD) {
			if (collisionWarning.objectId !== null) {
				entity.updateComponent("collisionWarning", {
					objectId: null,
					timeToCollision: 0,
					objectName: "",
				});
				pubsub.publish.pilot.collisionWarning.get({ shipId: entity.id });
			}
			return;
		}

		// Compute forward vector from ship's rotation
		rotationQuat.set(rotation.x, rotation.y, rotation.z, rotation.w);
		forwardDir.set(0, 0, 1).applyQuaternion(rotationQuat);

		// Compute cone height (detection range)
		const dt = this.frequency / 60;
		const maxAccel = this.getMaxAcceleration(entity);
		const coneHeight =
			currentSpeed * COLLISION_WARNING_SECONDS +
			0.5 * maxAccel * dt * dt;

		shipPos.set(position.x, position.y, position.z);

		// Ship bounding sphere radius (size is in meters, convert to km)
		const shipSize = entity.components.size;
		const shipRadiusKm = shipSize
			? Math.max(shipSize.length, shipSize.width, shipSize.height) / 2 / 1000
			: 0;
		const shipRadius =
			position.type === "interstellar"
				? kilometerToLightMinute(shipRadiusKm)
				: shipRadiusKm;

		let closestTTC = Number.POSITIVE_INFINITY;
		let closestId: number | null = null;
		let closestName = "";

		if (position.type === "solar") {
			this.checkSolarCandidates(
				entity,
				shipPos,
				forwardDir,
				coneHeight,
				currentSpeed,
				shipRadius,
				(id, name, ttc) => {
					if (ttc < closestTTC) {
						closestTTC = ttc;
						closestId = id;
						closestName = name;
					}
				},
			);
		} else {
			this.checkInterstellarCandidates(
				entity,
				shipPos,
				forwardDir,
				coneHeight,
				currentSpeed,
				shipRadius,
				(id, name, ttc) => {
					if (ttc < closestTTC) {
						closestTTC = ttc;
						closestId = id;
						closestName = name;
					}
				},
			);
		}

		// Determine if state has changed enough to publish
		const prevId = collisionWarning.objectId;
		const prevTTC = collisionWarning.timeToCollision;

		const hasNewThreat = closestId !== null;
		const hadThreat = prevId !== null;
		const idChanged = closestId !== prevId;
		const ttcShifted =
			hasNewThreat && hadThreat && Math.abs(closestTTC - prevTTC) > 0.5;

		if (idChanged || ttcShifted) {
			entity.updateComponent("collisionWarning", {
				objectId: closestId,
				timeToCollision: hasNewThreat ? closestTTC : 0,
				objectName: closestName,
			});
			pubsub.publish.pilot.collisionWarning.get({ shipId: entity.id });
		}
	}

	private getMaxAcceleration(entity: Entity): number {
		// Try warp engines first
		try {
			const warpEngine = getShipSystem(this.ecs, {
				systemType: "warpEngines",
				shipId: entity.id,
			});
			if (warpEngine?.components.isWarpEngines) {
				const position = entity.components.position;
				const cruisingSpeed =
					position?.type === "interstellar"
						? warpEngine.components.isWarpEngines.interstellarCruisingSpeed
						: warpEngine.components.isWarpEngines.solarCruisingSpeed;
				return cruisingSpeed / 10;
			}
		} catch {
			// No warp engines
		}

		// Fall back to impulse engines
		try {
			const impulseEngine = getShipSystem(this.ecs, {
				systemType: "impulseEngines",
				shipId: entity.id,
			});
			if (impulseEngine?.components.isImpulseEngines) {
				const thrust = impulseEngine.components.isImpulseEngines.thrust;
				const mass = entity.components.mass?.mass || 1;
				return thrust / mass;
			}
		} catch {
			// No impulse engines
		}

		return 0;
	}

	private checkSolarCandidates(
		entity: Entity,
		shipPosition: Vector3,
		forward: Vector3,
		coneHeight: number,
		currentSpeed: number,
		shipRadius: number,
		onCandidate: (id: number, name: string, ttc: number) => void,
	) {
		const shipSystemId = getObjectSystem(entity)?.id ?? null;
		const componentTypes = [
			"isPlanet",
			"isStar",
			"isShip",
			"isStarbase",
		] as const;

		for (const componentType of componentTypes) {
			const cache = this.ecs.componentCache.get(componentType);
			if (!cache) continue;

			for (const candidate of cache) {
				if (candidate.id === entity.id) continue;
				const candidateSystemId =
					getObjectSystem(candidate)?.id ?? null;
				if (candidateSystemId !== shipSystemId) continue;

				// Get position (handle orbiting bodies)
				if (candidate.components.satellite) {
					objectPos.copy(getCompletePositionFromOrbit(candidate));
				} else if (candidate.components.position) {
					objectPos.set(
						candidate.components.position.x,
						candidate.components.position.y,
						candidate.components.position.z,
					);
				} else {
					continue;
				}

				const radius = this.getCollisionRadius(candidate, false);

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
		}
	}

	private checkInterstellarCandidates(
		entity: Entity,
		shipPosition: Vector3,
		forward: Vector3,
		coneHeight: number,
		currentSpeed: number,
		shipRadius: number,
		onCandidate: (id: number, name: string, ttc: number) => void,
	) {
		// First pass: find solar systems along the forward ray
		const systemsInRange: Entity[] = [];
		const systemCache = this.ecs.componentCache.get("isSolarSystem");
		if (!systemCache) return;

		for (const system of systemCache) {
			if (!system.components.position) continue;
			objectPos.set(
				system.components.position.x,
				system.components.position.y,
				system.components.position.z,
			);

			toObject.subVectors(objectPos, shipPosition);
			const dist = toObject.length();
			if (dist > coneHeight || dist < 0.0001) continue;

			const dot = forward.dot(toObject) / dist;
			if (dot < CONE_COS_HALF_ANGLE) continue;
			systemsInRange.push(system);
		}

		if (systemsInRange.length === 0) return;

		// Second pass: check planets/stars within those systems
		const componentTypes = ["isPlanet", "isStar"] as const;

		for (const solarSystem of systemsInRange) {
			const systemPos = solarSystem.components.position!;

			for (const componentType of componentTypes) {
				const cache = this.ecs.componentCache.get(componentType);
				if (!cache) continue;

				for (const candidate of cache) {
					const candidateSystemId =
						getObjectSystem(candidate)?.id ?? null;
					if (candidateSystemId !== solarSystem.id) continue;

					// Get local position and convert to interstellar coordinates
					if (candidate.components.satellite) {
						objectPos.copy(
							getCompletePositionFromOrbit(candidate),
						);
					} else if (candidate.components.position) {
						objectPos.set(
							candidate.components.position.x,
							candidate.components.position.y,
							candidate.components.position.z,
						);
					} else {
						continue;
					}

					// Convert from local km to interstellar light-minutes
					objectPos.set(
						systemPos.x +
							kilometerToLightMinute(objectPos.x),
						systemPos.y +
							kilometerToLightMinute(objectPos.y),
						systemPos.z +
							kilometerToLightMinute(objectPos.z),
					);

					const radius = this.getCollisionRadius(candidate, true);

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
			}
		}
	}

	private getCollisionRadius(
		candidate: Entity,
		convertToLightMinutes: boolean,
	): number {
		let radius = 0;
		if (candidate.components.isPlanet) {
			radius = candidate.components.isPlanet.radius;
		} else if (candidate.components.isStar) {
			radius = solarRadiusToKilometers(
				candidate.components.isStar.radius as SolarRadius,
			);
		} else if (candidate.components.size) {
			// Ships and starbases: size is in meters, convert to km
			radius = candidate.components.size.length / 2 / 1000;
		}

		if (convertToLightMinutes) {
			radius = kilometerToLightMinute(radius);
		}

		return radius;
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
		const entryDistance = along - Math.sqrt(combinedRadius * combinedRadius - perpDistSq);
		const ttc = Math.max(0, entryDistance) / currentSpeed;

		if (ttc <= COLLISION_WARNING_SECONDS) {
			const name =
				candidate.components.identity?.name || "Unknown Object";
			onCandidate(candidate.id, name, ttc);
		}
	}
}
