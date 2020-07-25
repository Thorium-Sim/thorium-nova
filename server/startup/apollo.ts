import {ApolloServer, ApolloServerExpressConfig} from "apollo-server-express";
import {Application} from "express";
import buildSchema from "../helpers/buildSchema";
import {getGraphQLContext} from "../helpers/graphqlContext";
import App from "../app";

export default async function setupApollo(server: Application) {
  const schema = await buildSchema();
  const graphqlOptions: ApolloServerExpressConfig = {
    schema,
    tracing: process.env.NODE_ENV !== "production",
    introspection: true,
    playground: true,
    context: getGraphQLContext,
  };

  const apollo = new ApolloServer(graphqlOptions);
  // @ts-ignore
  apollo.applyMiddleware({app: (server as unknown) as Application});

  return apollo;
}
