import { type Entity, System } from "@thorium/utils/ecs";

export class ThrusterSystem extends System {
	static flightMode = ["nova"];
	test(entity: Entity) {
		return !!(entity.components.isThrusters && entity.components.isShipSystem);
	}
	update(entity: Entity, elapsed: number) {
		if (!entity.components.isThrusters) return;

		const { direction, directionThrust, rotationDelta, rotationThrust } =
			entity.components.isThrusters;

		const powerLevels = entity.components.power?.powerLevels || [1];
		const currentPower = entity.components.power?.currentPower || 1;
		const maxSafePower = powerLevels[powerLevels.length - 1];
		const requiredPower = powerLevels[0];

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
