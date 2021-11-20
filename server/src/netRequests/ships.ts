import {DataContext} from "../utils/DataContext";

export const shipsRequest = {
  shipsList: async (context: DataContext, param: {}, publishParams: {}) => {
    return context.flight?.ships;
  },
};
