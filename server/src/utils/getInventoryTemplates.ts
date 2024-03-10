import {FilterInventorySystem} from "@server/systems/FilterInventorySystem";
import type {ECS} from "./ecs";

export function getInventoryTemplates(ecs?: ECS | null) {
  const inventorySystem = ecs?.systems.find(
    sys => sys.constructor.name === "FilterInventorySystem"
  );
  if (inventorySystem instanceof FilterInventorySystem)
    return inventorySystem.getInventoryTemplates();

  return {};
}
