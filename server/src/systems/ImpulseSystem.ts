import { type Entity, System } from "../utils/ecs";
import { getSystemMaxSpeed } from "./SteeringBehaviorSystem";

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
	test(entity: Entity) {
		return !!(
			entity.components.isImpulseEngines && entity.components.isShipSystem
		);
	}
	update(entity: Entity) {
		const ship = this.ecs.entities.find((e) =>
			e.components.shipSystems?.shipSystems.has(entity.id),
		);
		if (!ship || !ship.components.isShip || !entity.components.isImpulseEngines)
			return;

		const { thrust, targetSpeed, cruisingSpeed } =
			entity.components.isImpulseEngines;

		const maxSpeed = Math.min(
			targetSpeed,
			getSystemMaxSpeed(entity, cruisingSpeed),
		);

		const forwardImpulse = (maxSpeed / cruisingSpeed) * thrust;
		entity.updateComponent("isImpulseEngines", { forwardImpulse });
	}
}
