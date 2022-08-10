import {InventoryTemplate} from "server/src/classes/Plugins/Inventory";
import {findClosestNode} from "server/src/systems/PassengerMovementSystem";
import {DataContext} from "server/src/utils/DataContext";
import {Entity} from "server/src/utils/ecs";
import {
  calculateShipMapPath,
  createShipMapGraph,
} from "server/src/utils/shipMapPathfinder";

function calculateCargoUsed(
  contents: {
    [inventoryTemplateName: string]: number;
  },
  inventory: {
    [inventoryTemplateName: string]: InventoryTemplate;
  }
) {
  return Object.keys(contents).reduce((acc, key) => {
    const template = inventory[key];
    if (!template) {
      return acc;
    }
    return acc + contents[key] * template.volume;
  }, 0);
}
export const requests = {
  inventoryTypes: (context: DataContext) => {
    return context.flight?.inventoryTemplates || {};
  },
  cargoRooms: (context: DataContext) => {
    if (!context.ship) throw new Error("No ship selected");
    const rooms =
      context.ship?.components.shipMap?.deckNodes
        .filter(node => node.isRoom && node.flags?.includes("cargo"))
        .map(node => {
          return {
            id: node.id,
            name: node.name,
            deck: context.ship?.components.shipMap?.decks[node.deckIndex].name,
            position: {x: node.x, y: node.y},
            volume: node.volume,
            contents: node.contents,
            used: calculateCargoUsed(
              node.contents,
              context.flight?.inventoryTemplates || {}
            ),
          };
        }) || [];
    const decks = context.ship.components.shipMap?.decks || [];
    return {
      rooms,
      decks,
      shipLength: context.ship.components.size?.length || 100,
    };
  },
  cargoContainers: (context: DataContext) => {
    if (!context.ship) throw new Error("No ship selected");

    return (
      context.flight?.ecs.entities
        .filter(
          entity =>
            entity.components.cargoContainer &&
            entity.components.position &&
            entity.components.passengerMovement
        )
        .map(entity => ({
          id: entity.id,
          name: `Container ${entity.id}`,
          position: entity.components.position,
        })) || []
    );
  },
};

export function dataStream(entity: Entity, context: DataContext): boolean {
  return Boolean(
    entity.components.cargoContainer &&
      entity.components.position?.parentId === context.ship?.id &&
      entity.components.passengerMovement
  );
}

export const inputs = {
  cargoContainerSummon: (context: DataContext, params: {roomId: number}) => {
    if (!context.ship) throw new Error("You are not assigned to a ship.");
    if (!context.ship.components.shipMap) throw new Error("Invalid ship map.");
    if (!context.ship.components.shipMap?.graph) {
      context.ship.updateComponent("shipMap", {
        graph: createShipMapGraph(
          context.ship.components.shipMap?.deckEdges || []
        ),
      });
    }
    const room = context.ship?.components.shipMap?.deckNodes.find(
      d => d.id === params.roomId
    );
    if (!room) throw new Error("No room found");

    // Find the closest container.
    const container = context.flight?.ecs.entities.reduce(
      (acc: Entity | null, entity) => {
        if (
          !entity.components.cargoContainer ||
          !entity.components.position ||
          entity.components.position.parentId !== context.ship?.id
        )
          return acc;
        if (!acc) return entity;

        // If the entity is busy, skip it
        if (Boolean(entity.components.passengerMovement?.nodePath.length))
          return acc;

        // Prioritize entities that are close to the target deck, but not busy.
        if (
          Math.abs(room.deckIndex - (acc.components.position?.z ?? Infinity)) <
          Math.abs(room.deckIndex - entity.components.position.z)
        ) {
          // If the acc entity is not busy, use it.
          return acc;
        }
        let accDistance = Infinity;
        if (acc?.components.position) {
          const {x, y} = acc.components.position;
          accDistance = Math.hypot(room.x - x, room.y - y);
        }
        let entityDistance = Infinity;
        if (entity.components.position) {
          const {x, y} = entity.components.position;
          entityDistance = Math.hypot(room.x - x, room.y - y);
        }
        if (entityDistance < accDistance) {
          return entity;
        }
        return acc;
      },
      null
    );

    if (!container?.components.position)
      throw new Error("No container available.");

    const closestNode = findClosestNode(
      context.ship.components.shipMap.deckNodes,
      container.components.position
    );
    if (!closestNode) throw new Error("No container available.");

    console.log(container.id, closestNode.id, closestNode.name, params.roomId);
    if (!context.ship.components.shipMap.graph)
      throw new Error("Invalid ship map.");
    const nodePath = calculateShipMapPath(
      context.ship.components.shipMap.graph,
      closestNode.id,
      params.roomId
    );

    if (nodePath) {
      container.updateComponent("passengerMovement", {
        nodePath,
        nextNodeIndex: 0,
      });
    }
  },
};
