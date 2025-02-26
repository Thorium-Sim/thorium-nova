import { pubsub } from "@thorium/.server/init/pubsub";
import type { ShipSystemTypes } from "@thorium/ecs-components/shipSystems";
import { type ECS, type Entity, System } from "@thorium/utils/ecs";

export class NPCKnowledgeSystem extends System {
	frequency = 10;
	test(entity: Entity) {
		return !!(
			entity.components.isShip && !entity.components.isPlayerShip?.value
		);
	}
	update(entity: Entity, _elapsedMs: number): void {}
}
