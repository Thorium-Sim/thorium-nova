import {ApolloServer, ApolloServerExpressConfig} from "apollo-server-express";
import {Application} from "express";
import {buildSchema} from "type-graphql";
import {resolvers} from "../schema";
import {pubsub} from "../helpers/pubsub";

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
    context: ({req, connection}) => ({
      clientId: req?.headers.clientid || connection?.context.clientId,
      core: req?.headers.core,
    }),
  };

  const apollo = new ApolloServer(graphqlOptions);
  apollo.applyMiddleware({app: (server as unknown) as Application});

  return apollo;
}
