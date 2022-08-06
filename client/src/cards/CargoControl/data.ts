import {DataContext} from "server/src/utils/DataContext";
import {Entity} from "server/src/utils/ecs";

export const requests = {
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
            volume: node.volume,
            // TODO August 2, 2022 - Also include the amount of cargo space that is currently used.
            used: 0,
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
