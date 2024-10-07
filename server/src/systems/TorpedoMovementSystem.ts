import { pubsub } from "@server/init/pubsub";
import { type Entity, System } from "@server/utils/ecs";
import { pursue } from "@server/utils/steering";
import { Vector3 } from "three";

const positionVector = new Vector3();
const targetPositionVector = new Vector3();
const velocityVector = new Vector3();
const newVelocityVector = new Vector3();
const targetVelocityVector = new Vector3();
export class TorpedoMovementSystem extends System {
	test(entity: Entity) {
		return !!entity.components.isTorpedo;
	}
	update(entity: Entity, deltaTime: number) {
		const deltaInSeconds = deltaTime / 1000;
		const component = entity.components.isTorpedo;
		if (!component) return;

		const { speed, maxForce } = component;
		const mass = entity.components.mass?.mass || 1500;
		{
			const { x, y, z } = entity.components.position || { x: 0, y: 0, z: 0 };
			positionVector.set(x, y, z);
		}
		{
			const { x, y, z } = entity.components.velocity || { x: 0, y: 0, z: 0 };
			velocityVector.set(x, y, z);
		}
		const target = component.targetId
			? this.ecs.getEntityById(component.targetId)
			: null;
		// If there's no target, continue traveling at the current velocity
		if (!target) return;
		{
			const { x, y, z } = target.components.position || { x: 0, y: 0, z: 0 };
			targetPositionVector.set(x, y, z);
		}
		{
			const { x, y, z } = target.components.velocity || { x: 0, y: 0, z: 0 };
			targetVelocityVector.set(x, y, z);
		}
		const predictionTime =
			positionVector.distanceTo(targetPositionVector) / speed;

		const desiredVelocity = pursue(
			positionVector,
			targetPositionVector,
			targetVelocityVector,
			predictionTime,
		)
			.normalize()
			.multiplyScalar(speed);
		const steering = desiredVelocity
			.sub(velocityVector)
			.normalize()
			.multiplyScalar(((maxForce * 1000) / mass) * deltaInSeconds);
		newVelocityVector.addVectors(velocityVector, steering);
		// Smooth out the velocity change just a little bit.
		velocityVector.lerp(newVelocityVector, 0.1);

		entity.updateComponent("velocity", {
			x: velocityVector.x,
			y: velocityVector.y,
			z: velocityVector.z,
		});
		entity.updateComponent("isTorpedo", {
			distanceTraveled:
				(component.distanceTraveled || 0) +
				velocityVector.length() * deltaInSeconds,
		});
		if (component.distanceTraveled > component.maxRange) {
			// TODO May 11, 2024: Make a small explosion on the viewscreen
			const systemId = entity.components.position?.parentId || null;
			this.ecs.removeEntity(entity);

			pubsub.publish.starmapCore.torpedos({
				systemId,
			});
		}
	}
}
