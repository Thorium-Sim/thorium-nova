import {DataContext} from "server/src/utils/DataContext";

export const subscriptions = {
  clientList: async (context: DataContext) => {
    const data = Object.values(context.server.clients);
    return data;
  },
};
