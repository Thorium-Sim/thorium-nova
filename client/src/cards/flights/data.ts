import {DataContext} from "server/src/utils/DataContext";

export const subscriptions = {
  flightsList(context: DataContext) {
    return Object.values(context.server.clients);
  },
};
