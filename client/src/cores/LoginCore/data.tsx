import {DataContext} from "server/src/utils/DataContext";

export const requests = {
  flightClients(context: DataContext) {
    if (!context.flight) return [];
    const serverClients = Object.values(context.server.clients);
    const flightClients = context.flight?.clients || {};
    const clients = serverClients
      .map(client => {
        const flightClient = flightClients[client.id];
        return {
          ...client.toJSON(),
          ...flightClient?.toJSON(),
        };
      })
      .filter(client => client.stationId);
    return clients;
  },
};
