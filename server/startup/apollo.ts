import {ApolloServer, ApolloServerExpressConfig} from "apollo-server-express";
import {Application} from "express";
import {
  graphqlUploadExpress, // The Express middleware.
} from "graphql-upload";
import buildSchema from "../helpers/buildSchema";
import {getGraphQLContext} from "../helpers/graphqlContext";

export default async function setupApollo(server: Application) {
  const schema = await buildSchema();
  const graphqlOptions: ApolloServerExpressConfig = {
    schema,
    tracing: process.env.NODE_ENV !== "production",
    introspection: true,
    playground: true,
    context: getGraphQLContext,
    uploads: false,
  };
  const apollo = new ApolloServer(graphqlOptions);
  server.use(graphqlUploadExpress());
  // @ts-ignore
  apollo.applyMiddleware({app: (server as unknown) as Application});

  return apollo;
}
