import {pubsub} from "@server/init/pubsub";
import {DeckNode} from "../classes/Plugins/Ship/Deck";
import {Entity, System} from "../utils/ecs";
import {Kelvin} from "@server/utils/unitTypes";

type DeckNodeMap = {
  [key: number]: NonNullable<
    Entity["components"]["shipMap"]
  >["deckNodes"][number] & {
    deckIndex: number;
    contents: {
      [inventoryTemplateName: string]: {count: number; temperature: Kelvin};
    };
  };
};

const deckNodeCache = new Map<number, DeckNodeMap>();

export class PassengerMovementSystem extends System {
  test(entity: Entity) {
    return !!(
      entity.components.passengerMovement && entity.components.position
    );
  }
  frequency = 5;
  update(entity: Entity, elapsed: number) {
    const elapsedRatio = elapsed / (1000 / this.frequency);
    const {position, passengerMovement} = entity.components;
    if (!position || !passengerMovement) return;
    const {x, y, z, parentId} = position;
    if (parentId === null) return;
    const ship = this.ecs.getEntityById(parentId);
    if (!ship?.components.shipMap) return;

    if (!deckNodeCache.has(ship.id)) {
      deckNodeCache.set(
        ship.id,
        ship.components.shipMap.deckNodes.reduce((acc: DeckNodeMap, node) => {
          acc[node.id] = node;
          return acc;
        }, {})
      );
    }
    const nextNode = deckNodeCache.get(ship.id)?.[
      passengerMovement.nodePath[passengerMovement.nextNodeIndex]
    ];
    if (!nextNode) {
      return;
    }
    const distanceToNext = Math.hypot(x - nextNode?.x, y - nextNode?.y); // Increment to the next node
    if (distanceToNext <= 0.1 && z === nextNode.deckIndex) {
      passengerMovement.nextNodeIndex++;
      if (
        passengerMovement.nextNodeIndex >= passengerMovement.nodePath.length
      ) {
        // We've reached the end of the path, so we're done.
        entity.updateComponent("passengerMovement", {
          nodePath: [],
          nextNodeIndex: 0,
        });
        passengerMovement.nodePath = [];
        passengerMovement.nextNodeIndex = 0;
        entity.updateComponent("position", {
          x: nextNode.x,
          y: nextNode.y,
          z: nextNode.deckIndex,
        });

        if (
          entity.components.cargoContainer &&
          entity.components.position?.parentId
        ) {
          pubsub.publish.cargoControl.containers({
            shipId: entity.components.position.parentId,
          });
        }
        return;
      }
    }
    // Move towards the next node
    const direction = Math.atan2(nextNode?.y - y, nextNode?.x - x);
    const velocity = Math.min(
      passengerMovement.movementMaxVelocity.x,
      distanceToNext
    );
    const zVelocity = Math.min(
      passengerMovement.movementMaxVelocity.z,
      nextNode.deckIndex - z
    );
    const newX = x + velocity * Math.cos(direction) * elapsedRatio;
    const newY = y + velocity * Math.sin(direction) * elapsedRatio;
    let newZ = z + zVelocity * elapsedRatio;
    if (Math.abs(newZ - nextNode.deckIndex) < 0.1) {
      // We've reached the next deck
      newZ = nextNode.deckIndex;
    }

    entity.updateComponent("position", {x: newX, y: newY, z: newZ});
  }
}

export function findClosestNode(
  nodes: {id: number; x: number; y: number; deckIndex: number}[],
  {x, y, z}: {x: number; y: number; z: number}
) {
  const node = nodes.reduce(
    (
      acc: {
        distance3d: number;
        node: null | {id: number; x: number; y: number; deckIndex: number};
      },
      node
    ) => {
      const distance3d = Math.hypot(node.x - x, node.y - y, node.deckIndex - z);
      if (distance3d < acc.distance3d) return {distance3d, node};
      return acc;
    },
    {distance3d: Infinity, node: null}
  );
  return node.node;
}
