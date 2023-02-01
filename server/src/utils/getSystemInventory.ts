import {Entity} from "./ecs";
import {getInventoryTemplates} from "./getInventoryTemplates";

/**
 * Get the inventory currently located in the room associated with this system
 * @param system - An ECS system
 * @returns
 */
export function getSystemInventory(system: Entity) {
  const shipFilterSystem = system.ecs?.systems.find(
    system => system.constructor.name === "FilterShipsWithReactors"
  );
  const systemShip = shipFilterSystem?.entities.find(ship =>
    ship.components.shipSystems?.shipSystems.has(system.id)
  );
  if (!systemShip) return null;

  const entityRoomId = systemShip.components.shipSystems?.shipSystems.get(
    system.id
  )?.roomId;
  const entityRoom = systemShip.components.shipMap?.deckNodes.find(
    node => node.id === entityRoomId
  );

  const inventoryTemplates = getInventoryTemplates(system.ecs);
  const roomInventory = Object.entries(entityRoom?.contents || {}).map(
    ([key, {count, temperature}]) => {
      const inventoryItem = inventoryTemplates[key];
      return {
        room: entityRoom,
        ...inventoryItem,
        count,
        name: key,
      };
    }
  );

  return roomInventory;
}
