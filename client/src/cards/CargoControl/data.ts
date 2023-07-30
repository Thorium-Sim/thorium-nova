import {t} from "@server/init/t";
import {pubsub} from "@server/init/pubsub";
import {matchSorter} from "match-sorter";
import {findClosestNode} from "server/src/systems/PassengerMovementSystem";
import {DataContext} from "server/src/utils/DataContext";
import {Entity} from "server/src/utils/ecs";
import {
  calculateShipMapPath,
  createShipMapGraph,
} from "server/src/utils/shipMapPathfinder";
import {z} from "zod";
import {getInventoryTemplates} from "@server/utils/getInventoryTemplates";
import {shipMap} from "@server/components/shipMap";
type ShipMapDeckNode = Zod.infer<typeof shipMap>["deckNodes"][number];

const transferId = z.object({
  type: z.union([z.literal("room"), z.literal("entity")]),
  id: z.number(),
});

const cargoRoomsCache = new Map<Entity, ShipMapDeckNode[]>();

const shipMapGraphCache = new Map<
  number,
  ReturnType<typeof createShipMapGraph>
>();

function getGraph(entity: Entity) {
  if (!shipMapGraphCache.has(entity.id)) {
    if (!entity.components.shipMap) throw new Error("Invalid ship map.");
    shipMapGraphCache.set(
      entity.id,
      createShipMapGraph(
        entity.components.shipMap?.deckEdges || [],
        entity.components.shipMap.deckNodes
      )
    );
  }
  return shipMapGraphCache.get(entity.id)!;
}

export const cargoControl = t.router({
  inventoryTypes: t.procedure.request(({ctx}) => {
    const inventorySystem = ctx.flight?.ecs.systems.find(
      sys => sys.constructor.name === "FilterInventorySystem"
    );
    return Object.fromEntries(
      inventorySystem?.entities.map(entity => [
        entity.components.identity?.name,
        {...entity.components.identity, ...entity.components.isInventory},
      ]) || []
    );
  }),
  rooms: t.procedure
    .filter((publish: {shipId: number} | null, {ctx}) => {
      if (publish && publish.shipId !== ctx.ship?.id) return false;
      return true;
    })
    .request(({ctx}) => {
      if (!ctx.ship) throw new Error("No ship selected");
      const inventoryTemplates = getInventoryTemplates(ctx.flight?.ecs);
      if (!cargoRoomsCache.get(ctx.ship)) {
        cargoRoomsCache.set(
          ctx.ship,
          ctx.ship.components.shipMap?.deckNodes.filter(
            node => node.isRoom && node.flags?.includes("cargo")
          ) || []
        );
      }
      const rooms =
        cargoRoomsCache.get(ctx.ship)!.map(node => {
          return {
            id: node.id,
            name: node.name,
            deck: ctx.ship?.components.shipMap?.decks[node.deckIndex].name,
            position: {x: node.x, y: node.y},
            volume: node.volume,
            contents: node.contents,
            used: calculateCargoUsed(node.contents, inventoryTemplates),
          };
        }) || [];
      const decks = ctx.ship.components.shipMap?.decks || [];
      return {
        rooms,
        decks,
        shipLength: ctx.ship.components.size?.length || 100,
      };
    }),
  containers: t.procedure
    .filter((publish: {shipId: number} | null, {ctx}) => {
      if (publish && publish.shipId !== ctx.ship?.id) return false;
      return true;
    })
    .request(({ctx}) => {
      if (!ctx.ship) throw new Error("No ship selected");
      const inventoryTemplates = getInventoryTemplates(ctx.flight?.ecs);

      return (
        ctx.flight?.ecs.entities
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
              name:
                entity.components.identity?.name || `Container ${entity.id}`,
              position: entity.components.position,
              contents: entity.components.cargoContainer?.contents || {},
              used: calculateCargoUsed(
                entity.components.cargoContainer?.contents || {},
                inventoryTemplates
              ),
              volume: entity.components.cargoContainer?.volume || 0,
              destinationNode:
                entity.components.passengerMovement?.destinationNode || null,
              entityState,
            };
          }) || []
      );
    }),
  search: t.procedure
    .input(z.object({query: z.string()}))
    .request(({ctx, input}) => {
      if (!ctx.ship) throw new Error("No ship selected");

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
      ctx.ship.components.shipMap?.decks.forEach((deck, i) => {
        output.push({
          id: i,
          type: "deck",
          name: deck.name,
          deck: deck.name,
          deckIndex: i,
        });
      });

      // Then rooms.
      ctx.ship.components.shipMap?.deckNodes.forEach(node => {
        if (node.isRoom && node.flags?.includes("cargo")) {
          output.push({
            id: node.id,
            type: "room",
            name: node.name || "",
            roomId: node.id,
            deck:
              ctx.ship?.components.shipMap?.decks[node.deckIndex].name || "",
            deckIndex: node.deckIndex,
          });

          // And the cargo items in the room.
          Object.entries(node.contents).forEach(([name, {count}], i) => {
            if (count === 0) return;
            output.push({
              id: Number(`${node.id}${i}${count}`),
              type: "inventory",
              name,
              room: node.name,
              roomId: node.id,
              count,
              deck:
                ctx.ship?.components.shipMap?.decks[node.deckIndex].name || "",
              deckIndex: node.deckIndex,
            });
          });
        }
      });

      return matchSorter(output, input.query, {keys: ["name"]}).slice(0, 10);
    }),
  stream: t.procedure.dataStream(({entity, ctx}) => {
    if (!entity) return false;
    return Boolean(
      entity.components.cargoContainer &&
        entity.components.position?.parentId === ctx.ship?.id &&
        entity.components.passengerMovement
    );
  }),
  containerSummon: t.procedure
    .input(z.object({roomId: z.number(), containerId: z.number().optional()}))
    .send(({ctx, input}) => {
      if (!ctx.ship) throw new Error("You are not assigned to a ship.");
      if (!ctx.ship.components.shipMap) throw new Error("Invalid ship map.");
      const graph = getGraph(ctx.ship);
      const room = ctx.ship?.components.shipMap?.deckNodes.find(
        d => d.id === input.roomId
      );
      if (!room) throw new Error("No room found");

      let container;
      if (typeof input.containerId === "number") {
        container = ctx.flight?.ecs.getEntityById(input.containerId);
      } else {
        // Find the closest container.
        container = ctx.flight?.ecs.entities.reduce(
          (acc: Entity | null, entity) => {
            if (
              !entity.components.cargoContainer ||
              !entity.components.position ||
              entity.components.position.parentId !== ctx.ship?.id
            )
              return acc;
            if (!acc) return entity;

            // If the entity is busy, skip it
            if (entity.components.passengerMovement?.nodePath.length)
              return acc;

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
        ctx.ship.components.shipMap.deckNodes,
        container.components.position
      );
      if (!closestNode) throw new Error("No container available.");

      let nodePath = calculateShipMapPath(graph, closestNode.id, input.roomId);

      if (nodePath) {
        container.updateComponent("passengerMovement", {
          nodePath,
          nextNodeIndex: 0,
          destinationNode: input.roomId,
        });
      } else {
        throw new Error("No path to room.");
      }

      if (container.components.position.parentId) {
        pubsub.publish.cargoControl.containers({
          shipId: container.components.position.parentId,
        });
      }
    }),
  transfer: t.procedure
    .input(
      z.object({
        fromId: transferId,
        toId: transferId,
        transfers: z.object({item: z.string(), count: z.number()}).array(),
      })
    )
    .send(({ctx, input}) => {
      const fromContainer = getCargoContents(ctx, input.fromId);
      if (!fromContainer) throw new Error("No source container found.");
      const toContainer = getCargoContents(ctx, input.toId);
      if (!toContainer) throw new Error("No destination container found.");

      const inventoryTemplates = getInventoryTemplates(ctx.flight?.ecs);

      let itemCounts: {[key: string]: number} = {};
      let destinationVolume = toContainer.volume || 0;
      // First loop to see if there are any errors
      input.transfers.forEach(({item, count}) => {
        if (
          !fromContainer.contents[item] ||
          fromContainer.contents[item].count < count
        ) {
          itemCounts[item] = fromContainer.contents[item].count;
        }
        const destinationUsedSpace = calculateCargoUsed(
          toContainer.contents || {},
          inventoryTemplates
        );
        const movedVolume = calculateCargoUsed(
          {[item]: {count: itemCounts[item] || count}},
          inventoryTemplates
        );

        if (destinationUsedSpace + movedVolume > destinationVolume) {
          const volumeLeft = destinationVolume - destinationUsedSpace;
          const singleVolume = calculateCargoUsed(
            {[item]: {count: 1}},
            inventoryTemplates
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
          {[item]: {count: itemCounts[item] || count}},
          inventoryTemplates
        );
        destinationVolume -= actualMovedVolume;
      });

      // Then loop to do the actual transfer
      input.transfers.forEach(({item, count}) => {
        fromContainer.contents[item].count -= itemCounts[item] || count;
        if (!toContainer.contents[item])
          toContainer.contents[item] = {count: 0, temperature: 295.37};

        // Average the temperatures of the items being transferred.
        // The formula we'll use for combining heat is
        // (T1 * C1 + T2 * C2) / (C1 + C2)
        const T1 = fromContainer.contents[item].temperature;
        const T2 = toContainer.contents[item].temperature;
        const C1 = toContainer.contents[item].count;
        const C2 = itemCounts[item] || count;

        toContainer.contents[item].count += C2;
        toContainer.contents[item].temperature =
          (T1 * C1 + T2 * C2) / (C1 + C2);
      });

      if (ctx.ship) {
        pubsub.publish.cargoControl.containers({
          shipId: ctx.ship?.id,
        });
        pubsub.publish.cargoControl.rooms({
          shipId: ctx.ship?.id,
        });
      }
    }),
});

function calculateCargoUsed(
  contents: {
    [inventoryTemplateName: string]: {count: number};
  },
  inventory: {
    [inventoryTemplateName: string]: {volume: number};
  }
) {
  if (!contents) return 0;
  const value = Object.keys(contents).reduce((acc, key) => {
    const template = inventory[key];
    if (!template) {
      return acc;
    }
    return acc + contents[key].count * template.volume;
  }, 0);

  return Math.round(value * 1000) / 1000;
}

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
