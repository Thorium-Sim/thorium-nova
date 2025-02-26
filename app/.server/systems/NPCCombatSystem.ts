import { pubsub } from "@thorium/.server/init/pubsub";
import type { ShipSystemTypes } from "@thorium/ecs-components/shipSystems";
import { type ECS, type Entity, System } from "@thorium/utils/ecs";

export class NPCCombatSystem extends System {
	test(entity: Entity) {
		return !!(
			entity.components.isShip && !entity.components.isPlayerShip?.value
		);
	}
	update(entity: Entity, _elapsedMs: number): void {
		const alertLevel = entity.components.isShip?.alertLevel || "5";
		const combatReady = ["1", "2"].includes(alertLevel);

		const shields = getSystemsOfType(this.ecs, entity.id, "Shields");
		if (combatReady) {
			for (const shield of shields) {
				shield.updateComponent("isShields", {
					state: "up",
				});
			}

			// If there is a target, load the torpedoes and charge phasers
		} else {
			for (const shield of shields) {
				shield.updateComponent("isShields", {
					state: "down",
				});
			}
		}
	}
}

function getSystemsOfType(
	ecs: ECS,
	shipId: number,
	systemType: Capitalize<Exclude<ShipSystemTypes, "generic">>,
) {
	const systemEntities: Entity[] = [];
	for (const entity of ecs.componentCache.get(`is${systemType}`) || []) {
		if (entity.components.isShipSystem?.shipId === shipId) {
			systemEntities.push(entity);
			break;
		}
	}
	return systemEntities;
}
