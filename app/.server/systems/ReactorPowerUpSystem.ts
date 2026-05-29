import { type Entity, System } from "@thorium/utils/ecs";

export class ReactorPowerUpSystem extends System {
	static flightMode = ["nova"];
	test(entity: Entity) {
		return !!entity.components.isReactor;
	}
	update(entity: Entity, elapsed: number) {
		if (!entity.components.isReactor) return;
		const { desiredOutput, currentOutput, powerUpSpeed } = entity.components.isReactor;
		if (desiredOutput === currentOutput) return;
		const elapsedTime = elapsed / 1000;
		entity.updateComponent("isReactor", {
			currentOutput: Math.min(desiredOutput, currentOutput + powerUpSpeed * elapsedTime),
		});
	}
}
