import { type Entity, System } from "../utils/ecs";

export class ThrusterSystem extends System {
	test(entity: Entity) {
		return !!(entity.components.isThrusters && entity.components.isShipSystem);
	}
	update(entity: Entity, elapsed: number) {
		if (!entity.components.isThrusters) return;

		const { direction, directionThrust, rotationDelta, rotationThrust } =
			entity.components.isThrusters;

		const currentPower = entity.components.power?.currentPower || 1;
		const maxSafePower = entity.components.power?.maxSafePower || 1;
		const requiredPower = entity.components.power?.requiredPower || 1;

		const powerRatio = currentPower / maxSafePower;

		const directionImpulse =
			currentPower >= requiredPower ? directionThrust * powerRatio : 0;
		const rotationImpulse =
			currentPower >= requiredPower ? rotationThrust * powerRatio : 0;
		entity.updateComponent("isThrusters", {
			directionImpulse: {
				x: direction.x * directionImpulse,
				y: direction.y * directionImpulse,
				z: direction.z * directionImpulse,
			},
			rotationImpulse: {
				x: rotationDelta.x * rotationImpulse,
				y: rotationDelta.y * rotationImpulse,
				z: rotationDelta.z * rotationImpulse,
			},
		});
	}
}
