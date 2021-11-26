import {DataContext} from "../utils/DataContext";

export const shipsRequest = {
  flightPlayerShips: async (context: DataContext) => {
    return context.flight?.playerShips || [];
  },
  shipsList: async (context: DataContext, param: {}, publishParams: {}) => {
    return context.flight?.ships;
  },
};
