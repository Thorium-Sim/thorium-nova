import { threatKnowledge } from "@thorium/.server/ai/threatKnowledge";
import { getShipSystem } from "@thorium/utils/.server/ship/getShipSystem";
import { type ECS, type Entity, System } from "@thorium/utils/ecs";

export class NPCKnowledgeSystem extends System {
	frequency = 10;
	test(entity: Entity) {
		return !!(
			entity.components.isShip && !entity.components.isPlayerShip?.value
		);
	}
	update(entity: Entity, _elapsedMs: number): void {
		// Make sure the NPC ship has a nearby objects system so it is included in the nearby objects calculation.
		if (!entity.components.nearbyObjects) {
			entity.addComponent("nearbyObjects");
		}

		const sensors = getShipSystem(this.ecs, {
			shipId: entity.id,
			systemType: "sensors",
		});

		const activeRange = sensors.components.isSensors?.activeRange;
		const passiveRange = sensors.components.isSensors?.passiveRange;
		// TODO March 29, 2025 Make this configurable
		const weaponsRange = 25_000; // targeting.components.isTargeting?.weaponsRange

		const alertLevel = entity.components.isShip?.alertLevel || "5";

		const threats = threatKnowledge(entity);

		entity.updateComponent("npcKnowledge", {
			activeRange,
			passiveRange,
			weaponsRange,
			alertLevel,
			threats,
		});
	}
}
