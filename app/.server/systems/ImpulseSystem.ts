import { type Entity, System } from "@thorium/utils/ecs";

/**
 * Determines the forward velocity applied by the impulse engines
 *
 * This works based on the power provided to the system.
 * The powerDraw and currentPower have already been calculated
 * by other systems. This system takes the currentPower value and
 * reverses the operation to determine what the actual target speed
 * is based on the power provided.
 *
 * It might be necessary to adjust the applied thrust as well, but
 * it also might not be necessary.
 */
export class ImpulseSystem extends System {
	static flightMode = ["nova"];
	test(entity: Entity) {
		return !!(entity.components.isImpulseEngines && entity.components.isShipSystem);
	}
	update(entity: Entity) {
		const ship = this.ecs.getEntityById(entity.components.isShipSystem?.shipId || -1);
		if (!ship || !ship.components.isShip || !entity.components.isImpulseEngines) return;

		const shipMass = ship.components.mass?.mass || 700000000;
		let { acceleration, targetSpeed, cruisingSpeed } = entity.components.isImpulseEngines;
		const thrustForce = acceleration * shipMass;

		if (entity.components.power) {
			const { currentPower, powerLevels } = entity.components.power || {};
			const requiredPower = powerLevels[0];
			const maxSafePower = powerLevels[powerLevels.length - 1];
			targetSpeed = Math.min(
				targetSpeed,
				cruisingSpeed * (Math.max(0, currentPower) / maxSafePower),
			);

			if (currentPower < requiredPower) targetSpeed = 0;
		}
		const forwardImpulse = (targetSpeed / cruisingSpeed) * thrustForce;
		entity.updateComponent("isImpulseEngines", { forwardImpulse });
	}
}
