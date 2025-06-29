import { threatKnowledge } from "@thorium/.server/ai/threatKnowledge";
import { getShipSystem } from "@thorium/utils/.server/ship/getShipSystem";
import { type ECS, type Entity, System } from "@thorium/utils/ecs";
import type { threatScores } from "@thorium/utils/flags/shipObjectives";
import type z from "zod";
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

		const threats = threatKnowledge(entity);
		const goals = goalsKnowledge(entity);

		entity.updateComponent("npcKnowledge", {
			activeRange,
			passiveRange,
			weaponsRange,
			threats,
		});
	}
}

// Goals are for

// Example goals
// search a ship for cargo
// pursue a suspicious ship
// steal an item from a ship
// move into combat position
// flee when overly damaged
function goalsKnowledge(entity: Entity) {}
