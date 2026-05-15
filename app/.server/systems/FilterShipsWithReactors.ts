import { type Entity, System } from "@thorium/utils/ecs";

export class FilterShipsWithReactors extends System {
	static flightMode = ["nova"];
	test(entity: Entity) {
		if (!entity.components.isShip || !entity.components.shipSystems) return false;

		for (const id of entity.components.shipSystems.shipSystems.keys()) {
			const e = entity.ecs?.getEntityById(id);
			if (e?.components.isReactor) return true;
		}
		return false;
	}
}
