import {InventoryFlags} from "@server/classes/Plugins/Inventory/InventoryFlags";
import {ECS} from "./ecs";

export function getInventoryTemplates(ecs?: ECS | null) {
  const inventorySystem = ecs?.systems.find(
    sys => sys.constructor.name === "FilterInventorySystem"
  );
  const data = (Object.fromEntries(
    inventorySystem?.entities.map(entity => [
      entity.components.identity?.name,
      {...entity.components.identity, ...entity.components.isInventory},
    ]) || []
  ) || {}) as Record<
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
  return data;
}
