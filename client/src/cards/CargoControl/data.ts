import {matchSorter} from "match-sorter";
import {InventoryTemplate} from "server/src/classes/Plugins/Inventory";
import {findClosestNode} from "server/src/systems/PassengerMovementSystem";
import {DataContext} from "server/src/utils/DataContext";
import {Entity} from "server/src/utils/ecs";
import {pubsub} from "server/src/utils/pubsub";
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
  if (!contents) return 0;
  const value = Object.keys(contents).reduce((acc, key) => {
    const template = inventory[key];
    if (!template) {
      return acc;
    }
    return acc + contents[key] * template.volume;
  }, 0);

  return Math.round(value * 1000) / 1000;
}
export const requests = {
  inventoryTypes: (context: DataContext) => {
    return context.flight?.inventoryTemplates || {};
  },
  cargoRooms: (
    context: DataContext,
    params: {},
    publishParams: {shipId: number} | null
  ) => {
    if (publishParams && publishParams.shipId !== context.ship?.id) throw null;
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
  cargoContainers: (
    context: DataContext,
    params: {},
    publishParams: {shipId: number}
  ) => {
    if (publishParams && context.ship?.id !== publishParams.shipId) throw null;
    if (!context.ship) throw new Error("No ship selected");
    return (
      context.flight?.ecs.entities
        .filter(
          entity =>
            entity.components.cargoContainer &&
            entity.components.position &&
            entity.components.passengerMovement
        )
        .map(entity => {
          const entityState: "idle" | "enRoute" =
            entity.components.passengerMovement?.nodePath.length === 0
              ? "idle"
              : "enRoute";
          return {
            id: entity.id,
            name: entity.components.identity?.name || `Container ${entity.id}`,
            position: entity.components.position,
            contents: entity.components.cargoContainer?.contents || {},
            used: calculateCargoUsed(
              entity.components.cargoContainer?.contents || {},
              context.flight?.inventoryTemplates || {}
            ),
            volume: entity.components.cargoContainer?.volume || 0,
            destinationNode:
              entity.components.passengerMovement?.destinationNode || null,
            entityState,
          };
        }) || []
    );
  },
  cargoSearch: (context: DataContext, args: {query: string}) => {
    if (!context.ship) throw new Error("No ship selected");

    const output: {
      id: number;
      type: "deck" | "room" | "inventory";
      room?: string;
      count?: number;
      roomId?: number;
      name: string;
      deck: string;
      deckIndex: number;
    }[] = [];
    // We're searching for decks, rooms, and cargo items.
    // First decks.
    context.ship.components.shipMap?.decks.forEach((deck, i) => {
      output.push({
        id: i,
        type: "deck",
        name: deck.name,
        deck: deck.name,
        deckIndex: i,
      });
    });

    // Then rooms.
    context.ship.components.shipMap?.deckNodes.forEach(node => {
      if (node.isRoom && node.flags?.includes("cargo")) {
        output.push({
          id: node.id,
          type: "room",
          name: node.name,
          roomId: node.id,
          deck:
            context.ship?.components.shipMap?.decks[node.deckIndex].name || "",
          deckIndex: node.deckIndex,
        });

        // And the cargo items in the room.
        Object.entries(node.contents).forEach(([name, count], i) => {
          if (count === 0) return;
          output.push({
            id: Number(`${node.id}${i}${count}`),
            type: "inventory",
            name,
            room: node.name,
            roomId: node.id,
            count,
            deck:
              context.ship?.components.shipMap?.decks[node.deckIndex].name ||
              "",
            deckIndex: node.deckIndex,
          });
        });
      }
    });

    return matchSorter(output, args.query, {keys: ["name"]}).slice(0, 10);
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
  cargoContainerSummon: (
    context: DataContext,
    params: {roomId: number; containerId?: number}
  ) => {
    if (!context.ship) throw new Error("You are not assigned to a ship.");
    if (!context.ship.components.shipMap) throw new Error("Invalid ship map.");
    if (!context.ship.components.shipMap?.graph) {
      context.ship.updateComponent("shipMap", {
        graph: createShipMapGraph(
          context.ship.components.shipMap?.deckEdges || [],
          context.ship.components.shipMap.deckNodes
        ),
      });
    }
    const room = context.ship?.components.shipMap?.deckNodes.find(
      d => d.id === params.roomId
    );
    if (!room) throw new Error("No room found");

    let container;
    if (typeof params.containerId === "number") {
      container = context.flight?.ecs.getEntityById(params.containerId);
    } else {
      // Find the closest container.
      container = context.flight?.ecs.entities.reduce(
        (acc: Entity | null, entity) => {
          if (
            !entity.components.cargoContainer ||
            !entity.components.position ||
            entity.components.position.parentId !== context.ship?.id
          )
            return acc;
          if (!acc) return entity;

          // If the entity is busy, skip it
          if (entity.components.passengerMovement?.nodePath.length) return acc;

          // Prioritize entities that are close to the target deck, but not busy.
          if (
            Math.abs(
              room.deckIndex - (acc.components.position?.z ?? Infinity)
            ) < Math.abs(room.deckIndex - entity.components.position.z)
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
    }

    if (!container?.components.position)
      throw new Error("No container available.");

    const closestNode = findClosestNode(
      context.ship.components.shipMap.deckNodes,
      container.components.position
    );
    if (!closestNode) throw new Error("No container available.");

    if (!context.ship.components.shipMap.graph)
      throw new Error("Invalid ship map.");

    let nodePath = calculateShipMapPath(
      context.ship.components.shipMap.graph,
      closestNode.id,
      params.roomId
    );

    if (nodePath) {
      container.updateComponent("passengerMovement", {
        nodePath,
        nextNodeIndex: 0,
        destinationNode: params.roomId,
      });
    } else {
      throw new Error("No path to room.");
    }

    if (container.components.position.parentId) {
      pubsub.publish("cargoContainers", {
        shipId: container.components.position.parentId,
      });
    }
  },
  cargoTransfer: (
    context: DataContext,
    params: {
      fromId: {type: "room" | "entity"; id: number};
      toId: {type: "room" | "entity"; id: number};
      transfers: {item: string; count: number}[];
    }
  ) => {
    const fromContainer = getCargoContents(context, params.fromId);
    if (!fromContainer) throw new Error("No source container found.");
    const toContainer = getCargoContents(context, params.toId);
    if (!toContainer) throw new Error("No destination container found.");

    let itemCounts: {[key: string]: number} = {};
    let destinationVolume = toContainer.volume;
    // First loop to see if there are any errors
    params.transfers.forEach(({item, count}) => {
      if (
        !fromContainer.contents[item] ||
        fromContainer.contents[item] < count
      ) {
        itemCounts[item] = fromContainer.contents[item];
      }
      const destinationUsedSpace = calculateCargoUsed(
        toContainer.contents || {},
        context.flight?.inventoryTemplates || {}
      );
      const movedVolume = calculateCargoUsed(
        {[item]: itemCounts[item] || count},
        context.flight?.inventoryTemplates || {}
      );

      if (destinationUsedSpace + movedVolume > destinationVolume) {
        const volumeLeft = destinationVolume - destinationUsedSpace;
        const singleVolume = calculateCargoUsed(
          {[item]: 1},
          context.flight?.inventoryTemplates || {}
        );
        const cargoItemsThatFitInVolumeLeft = Math.floor(
          volumeLeft / singleVolume
        );

        itemCounts[item] = Math.min(
          itemCounts[item] || count,
          cargoItemsThatFitInVolumeLeft
        );
        if (itemCounts[item] <= 0)
          throw new Error("Not enough space in destination.");
      }
      const actualMovedVolume = calculateCargoUsed(
        {[item]: itemCounts[item] || count},
        context.flight?.inventoryTemplates || {}
      );
      destinationVolume -= actualMovedVolume;
    });

    // Then loop to do the actual transfer
    params.transfers.forEach(({item, count}) => {
      fromContainer.contents[item] -= itemCounts[item] || count;
      if (!toContainer.contents[item]) toContainer.contents[item] = 0;
      toContainer.contents[item] += itemCounts[item] || count;
    });

    if (context.ship) {
      pubsub.publish("cargoContainers", {
        shipId: context.ship?.id,
      });
      pubsub.publish("cargoRooms", {
        shipId: context.ship?.id,
      });
    }
  },
};

function getCargoContents(
  context: DataContext,
  {type, id}: {type: "room" | "entity"; id: number}
) {
  if (type === "entity") {
    const entity = context.flight?.ecs.getEntityById(id);
    const container = entity?.components.cargoContainer;
    if (!container) return null;
    return {volume: container.volume, contents: container.contents};
  }
  if (type === "room") {
    const room = context.ship?.components.shipMap?.deckNodes.find(
      d => d.id === id
    );
    if (!room) return null;
    return {volume: room.volume, contents: room.contents};
  }
  return null;
}
