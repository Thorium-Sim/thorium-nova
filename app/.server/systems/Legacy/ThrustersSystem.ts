import { pubsub } from "@thorium/.server/init/pubsub";
import { System, type Entity } from "@thorium/utils/ecs";

export class LegacyThrustersSystem extends System {
	static flightMode = ["legacy"];
	frequency = 2;
	test(entity: Entity) {
		return !!entity.components.isThrusters;
	}
	update(entity: Entity, elapsed: number) {
		const elapsedMinutes = elapsed / 1000 / 60;
		const ship = this.ecs.getEntityById(
			entity.components.isShipSystem?.shipId || -1,
		);
		const rotation = ship?.components.rotation;

		const isThrusters = entity.components.isThrusters;
		if (!rotation || !isThrusters) return;
		let { yaw, pitch, roll } = rotation;

		const { rotationDelta, rotationMaxSpeed } = isThrusters;

		yaw =
			(yaw + rotationDelta.y * (rotationMaxSpeed * 360) * elapsedMinutes) % 360;
		pitch =
			(pitch + rotationDelta.x * (rotationMaxSpeed * 360) * elapsedMinutes) %
			360;
		roll =
			(roll + rotationDelta.z * (rotationMaxSpeed * 360) * elapsedMinutes) %
			360;

		if (yaw < 0) yaw += 360;
		if (pitch < 0) pitch += 360;
		if (roll < 0) roll += 360;

		ship.updateComponent("rotation", { yaw, pitch, roll });
		pubsub.publish.legacy.thrusters.get({ shipId: ship.id });
	}
}
