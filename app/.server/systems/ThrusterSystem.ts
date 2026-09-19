import { type Entity, System } from "@thorium/utils/ecs";
import { Object3D, Vector3 } from "three";

const directionVector = new Vector3();
const rotationVector = new Vector3();
const velocityVector = new Vector3();
const rotationVelocityVector = new Vector3();
const tempObj = new Object3D();

export class ThrusterSystem extends System {
	static flightMode = ["nova"];
	test(entity: Entity) {
		return !!(entity.components.isThrusters && entity.components.isShipSystem);
	}
	update(entity: Entity) {
		if (!entity.components.isThrusters) return;
		const ship = this.ecs.getEntityById(entity.components.isShipSystem?.shipId || -1);
		if (!ship || !ship.components.isShip || !entity.components.isThrusters) return;

		const shipMass = ship.components.mass?.mass || 700000000;
		if (ship.components.velocity) {
			const { x, y, z } = ship.components.velocity;
			velocityVector.set(x, y, z);
		}
		if (ship.components.rotationVelocity) {
			const { x, y, z } = ship.components.rotationVelocity;
			rotationVelocityVector.set(x, y, z);
		}
		if (ship.components.rotation) {
			const { x, y, z, w } = ship.components.rotation;
			tempObj.quaternion.set(x, y, z, w);
		}
		const localVelocity = tempObj.worldToLocal(velocityVector);

		// Convert velocity to be oriented to the ship's direction.
		const {
			direction,
			directionAcceleration,
			rotationDelta,
			rotationAcceleration,
			directionMaxSpeed,
		} = entity.components.isThrusters;

		const directionForce = directionAcceleration * shipMass;
		const rotationForce = rotationAcceleration * shipMass;

		const powerLevels = entity.components.power?.powerLevels || [1];
		const currentPower = entity.components.power?.currentPower || 1;
		const maxSafePower = powerLevels[powerLevels.length - 1];
		const requiredPower = powerLevels[0];

		const powerRatio = currentPower / maxSafePower;

		let directionImpulse = currentPower >= requiredPower ? directionForce * powerRatio : 0;
		const rotationImpulse = currentPower >= requiredPower ? rotationForce * powerRatio : 0;
		localVelocity.set(
			0.1 ** (Math.abs(localVelocity.x) / directionMaxSpeed),
			0.1 ** (Math.abs(localVelocity.y) / directionMaxSpeed),
			0.1 ** (Math.abs(localVelocity.z) / directionMaxSpeed),
		);

		const [x, y, z] = directionVector
			.set(direction.x, direction.y, direction.z)
			.multiplyScalar(directionImpulse)
			.multiply(localVelocity)
			.toArray();

		const [rx, ry, rz] = rotationVector
			.set(rotationDelta.x, rotationDelta.y, rotationDelta.z)
			.multiplyScalar(rotationImpulse)
			// .multiply(rotationVelocityVector)
			.toArray();

		entity.updateComponent("isThrusters", {
			directionImpulse: {
				x,
				y,
				z,
			},
			rotationImpulse: {
				x: rx,
				y: ry,
				z: rz,
			},
		});
	}
}
