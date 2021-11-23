import {DataContext} from "../utils/DataContext";

export const clientsRequest = {
  clients: (context: DataContext) => {
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
