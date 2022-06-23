import InventoryPlugin from "../classes/Plugins/Inventory";
import {Entity} from "../utils/ecs";

export function spawnInventory(template: InventoryPlugin, containerId: number) {
  const entity = new Entity();

  entity.addComponent("isInventory", {
    volume: template.volume,
    continuous: template.continuous,
    flags: template.flags,
    assets: template.assets,
    containerId,
  });
  entity.addComponent("identity", {
    name: template.name,
    plural: template.plural,
    description: template.description,
  });
  entity.addComponent("tags", {
    tags: template.tags,
  });

  return entity;
}
