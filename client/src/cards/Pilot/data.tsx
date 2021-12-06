import {DataContext} from "server/src/utils/DataContext";

export const subscriptions = {
  ship(context: DataContext) {
    return context.ship;
  },
};
