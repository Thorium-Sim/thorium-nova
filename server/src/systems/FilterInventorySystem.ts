import {Entity, System} from "../utils/ecs";

export class FilterInventorySystem extends System {
  test(entity: Entity) {
    return !!entity.components.isInventory;
  }
}
