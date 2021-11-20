import {DataContext} from "server/src/utils/DataContext";

export const subscriptions = {
  clientList: async (context: DataContext) => {
    const serverClients = Object.values(context.server.clients);
    const flightClients = context.flight?.clients || {};
    const clients = serverClients.map(client => {
      const flightClient = flightClients[client.id];
      return {
        ...client.toJSON(),
        ...flightClient?.toJSON(),
      };
    });
    return clients;
  },
};
