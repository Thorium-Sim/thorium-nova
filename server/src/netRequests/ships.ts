import {DataContext} from "../utils/DataContext";

export const shipsRequest = {
  flightPlayerShips: async (context: DataContext) => {
    return context.flight?.playerShips.map(ship => ship.toJSON()) || [];
  },
};
