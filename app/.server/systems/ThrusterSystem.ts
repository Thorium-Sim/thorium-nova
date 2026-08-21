import { type Entity, System } from "@thorium/utils/ecs";

export class ThrusterSystem extends System {
	static flightMode = ["nova"];
	test(entity: Entity) {
		return !!(entity.components.isThrusters && entity.components.isShipSystem);
	}
	update(entity: Entity) {
		if (!entity.components.isThrusters) return;
		const ship = this.ecs.getEntityById(entity.components.isShipSystem?.shipId || -1);
		if (!ship || !ship.components.isShip || !entity.components.isImpulseEngines) return;

		const shipMass = ship.components.mass?.mass || 700000000;

		const { direction, directionAcceleration, rotationDelta, rotationAcceleration } =
			entity.components.isThrusters;

		const directionForce = directionAcceleration * shipMass;
		const rotationForce = rotationAcceleration * shipMass;

		const powerLevels = entity.components.power?.powerLevels || [1];
		const currentPower = entity.components.power?.currentPower || 1;
		const maxSafePower = powerLevels[powerLevels.length - 1];
		const requiredPower = powerLevels[0];

		const powerRatio = currentPower / maxSafePower;

		const directionImpulse = currentPower >= requiredPower ? directionForce * powerRatio : 0;
		const rotationImpulse = currentPower >= requiredPower ? rotationForce * powerRatio : 0;
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
