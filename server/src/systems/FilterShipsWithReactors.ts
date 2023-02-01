import {Entity, System} from "../utils/ecs";

export class FilterShipsWithReactors extends System {
  test(entity: Entity) {
    if (!entity.components.isShip || !entity.components.shipSystems)
      return false;

    for (let id of entity.components.shipSystems.shipSystems.keys()) {
      const e = entity.ecs?.getEntityById(id);
      if (e?.components.isReactor) return true;
    }
    return false;
  }
}
