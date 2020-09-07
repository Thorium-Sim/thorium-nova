import {ExpressContext} from "apollo-server-express/dist/ApolloServer";
import App from "../app";
import Client from "../schema/client";
import Flight from "../schema/flight";
import Entity from "./ecs/entity";

export interface GraphQLContext {
  clientId: string;
  client?: Client;
  flight?: Flight;
  ship?: Entity;
  core?: boolean;

  // Plugin Operations
  pluginId?: string;
}

export const getGraphQLContext = ({
  req,
  connection,
}: ExpressContext): GraphQLContext => {
  const clientId = req?.headers.clientid || connection?.context.clientid;
  const client = App.storage.clients.find(c => c.id === clientId);
  const flight = App.activeFlight || undefined;
  const ship = App.activeFlight?.ships.find(s => s.id === client?.shipId);

  return {
    clientId,
    client,
    flight,
    ship,
    core: !!req?.headers.core,
  };
};
