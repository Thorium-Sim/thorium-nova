import {DataContext} from "../utils/DataContext";

export const shipsRequest = {
  flightPlayerShips: async (context: DataContext) => {
    return (
      context.flight?.playerShips.map(ship => {
        const systemId = ship.components.position?.parentId;
        const systemPosition = systemId
          ? context.flight?.ecs.getEntityById(systemId)?.components.position ||
            null
          : null;

        return {
          id: ship.id,
          name: ship.components.identity?.name,
          currentSystem: systemId || null,
          systemPosition,
          stations: ship.components.stationComplement?.stations || [],
        };
      }) || []
    );
  },
};
