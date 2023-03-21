import {InventoryFlags} from "@server/classes/Plugins/Inventory/InventoryFlags";
import {Entity, System} from "../utils/ecs";

export class FilterInventorySystem extends System {
  inventoryTemplates!: Record<
    string,
    {
      name: string;
      description?: string;
      plural?: string;
      volume: number;
      continuous: boolean;
      durability: number;
      abundance: number;
      flags: InventoryFlags;
      assets: {image?: string};
    }
  >;
  invalidated = false;
  test(entity: Entity) {
    return !!entity.components.isInventory;
  }
  private cacheInventoryTemplates() {
    this.inventoryTemplates =
      Object.fromEntries(
        this.entities.map(entity => [
          entity.components.identity?.name,
          {...entity.components.identity, ...entity.components.isInventory},
        ]) || []
      ) || {};
    this.invalidated = false;
  }
  addEntity(entity: Entity): void {
    super.addEntity(entity);
    this.invalidated = true;
  }
  removeEntity(entity: Entity): void {
    super.removeEntity(entity);
    this.invalidated = true;
  }
  getInventoryTemplates() {
    if (!this.inventoryTemplates || this.invalidated)
      this.cacheInventoryTemplates();
    return this.inventoryTemplates;
  }
}
