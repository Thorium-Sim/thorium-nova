import { pubsub } from "@thorium/.server/init/pubsub";
import { type Entity, System } from "@thorium/utils/ecs";
import { Quaternion, Vector3, Matrix4 } from "three";

const shipPosition = new Vector3();
const waypointPosition = new Vector3();
const up = new Vector3(0, 1, 0);
const matrix = new Matrix4();
const rotationMatrix = new Matrix4().makeRotationY(-Math.PI);
const rotationQuat = new Quaternion();
const desiredRotationQuat = new Quaternion();
const dirVector1 = new Vector3();
const dirVector2 = new Vector3();
const HELIOPAUSE_DISTANCE_KM = 20_000_000_000;

export class FacingWaypointSystem extends System {
	static flightMode = ["nova"];
	frequency = 5;

	test(entity: Entity) {
		return !!(
			entity.components.isShip &&
			entity.components.position &&
			entity.components.rotation &&
			entity.components.facingWaypoints
		);
	}

	update(entity: Entity) {
		const { position, rotation, facingWaypoints } = entity.components;
		if (!position || !rotation || !facingWaypoints) return;

		shipPosition.set(position.x, position.y, position.z);

		const facingEntries: { id: number; distance: number }[] = [];

		const shipSystemEntity = position.parentId ? this.ecs.getEntityById(position.parentId) : null;
		const shipSystemPosition = shipSystemEntity?.components.position || null;

		for (const waypoint of this.ecs.componentCache.get("isWaypoint") || []) {
			if (waypoint.components.isWaypoint?.assignedShipId !== entity.id) continue;
			if (!waypoint.components.isWaypoint.isActive) continue;
			if (!waypoint.components.position) continue;

			const wpPosition = waypoint.components.position;
			const wpParentId = wpPosition.parentId;

			// Resolve waypoint position into ship's coordinate space
			if (wpParentId === position.parentId) {
				// Same system (or both in interstellar space)
				waypointPosition.set(wpPosition.x, wpPosition.y, wpPosition.z);
			} else {
				const wpSystemEntity = wpParentId ? this.ecs.getEntityById(wpParentId) : null;
				const wpSystemPosition = wpSystemEntity?.components.position || null;

				if (position.parentId === null && wpSystemPosition) {
					// Ship is in interstellar space
					waypointPosition.set(wpSystemPosition.x, wpSystemPosition.y, wpSystemPosition.z);
				} else if (wpSystemPosition && shipSystemPosition) {
					// Cross-system: place at heliopause direction
					dirVector1.set(shipSystemPosition.x, shipSystemPosition.y, shipSystemPosition.z);
					dirVector2.set(wpSystemPosition.x, wpSystemPosition.y, wpSystemPosition.z);
					waypointPosition
						.subVectors(dirVector2, dirVector1)
						.normalize()
						.multiplyScalar(HELIOPAUSE_DISTANCE_KM);
				} else {
					continue;
				}
			}

			// Compute the facing angle using the ship's own up vector so
			// the check is roll-agnostic (only yaw/pitch matter for locking on).
			rotationQuat.set(rotation.x, rotation.y, rotation.z, rotation.w);
			up.set(0, 1, 0).applyQuaternion(rotationQuat);
			matrix.lookAt(shipPosition, waypointPosition, up).multiply(rotationMatrix);
			desiredRotationQuat.setFromRotationMatrix(matrix);

			const angle = Math.abs(rotationQuat.angleTo(desiredRotationQuat));
			// 3 degrees = PI/60 radians
			if (angle < Math.PI / 60) {
				const distance = shipPosition.distanceTo(waypointPosition);
				facingEntries.push({ id: waypoint.id, distance });
			}
		}

		// Sort by distance so the nearest facing waypoint is first
		facingEntries.sort((a, b) => a.distance - b.distance);
		const facingIds = facingEntries.map((e) => e.id);

		// Only update the component if the facing waypoints have changed
		const currentFacing = facingWaypoints.ids;
		if (
			facingIds.length !== currentFacing.length ||
			facingIds.some((id, i) => currentFacing[i] !== id)
		) {
			entity.updateComponent("facingWaypoints", { ids: facingIds });
			pubsub.publish.pilot.autopilot.get({ shipId: entity.id });
		}
	}
}
