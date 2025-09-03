import { type Entity, System } from "@thorium/utils/ecs";

export class PassengerDestinationSystem extends System {
	static flightMode = ["nova"];
	test(entity: Entity) {
		return !!entity.components.passengerMovement;
	}
	frequency = 10;
	update(entity: Entity, elapsed: number) {
		const elapsedRatio = elapsed / 1000;
	}
}
