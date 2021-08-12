import {DataContext} from "server/src/utils/DataContext";

export const subscriptions = {
  flightsList: {
    filter: (params: {flights: boolean}) => {
      return params?.flights;
    },
    fetch: (context: DataContext) => {
      return Object.values(context.server.clients).map(c => c.serialize());
    },
  },
};
