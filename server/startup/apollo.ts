import {ApolloServer, ApolloServerExpressConfig} from "apollo-server-express";
import {Application} from "express";
import {buildSchema} from "type-graphql";
import {resolvers} from "../schema";
import {pubsub} from "../helpers/pubsub";
import App from "../app";

export default async function setupApollo(server: Application) {
  const schema = await buildSchema({
    resolvers,
    pubSub: pubsub,
  });
  const graphqlOptions: ApolloServerExpressConfig = {
    schema,
    tracing: process.env.NODE_ENV !== "production",
    introspection: true,
    playground: true,
    uploads: false,
    context: ({req, connection}) => {
      const clientId = req?.headers.clientid || connection?.context.clientid;
      const client = App.storage.clients.find(c => c.id === clientId);
      const flight = App.activeFlight;
      const ship = App.activeFlight?.ships.find(s => s.id === client?.shipId);

      return {
        clientId,
        client,
        flight,
        ship,
        core: !!req?.headers.core,
      };
    },
  };

  const apollo = new ApolloServer(graphqlOptions);
  // @ts-ignore
  apollo.applyMiddleware({app: (server as unknown) as Application});

  return apollo;
}
