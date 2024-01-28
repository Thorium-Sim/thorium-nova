import {t} from "@server/init/t";

export const loginCore = t.router({
  clients: t.procedure.request(({ctx}) => {
    if (!ctx.flight) return [];
    const serverClients = Object.values(ctx.server.clients);
    const flightClients = ctx.flight?.clients || {};
    const clients = serverClients
      .map(client => {
        const flightClient = flightClients[client.id];
        return {...flightClient?.toJSON(), name: client.name};
      })
      .filter(client => client.stationId);
    return clients;
  }),
});
