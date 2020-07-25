import {graphql, GraphQLSchema} from "graphql";
import {Maybe} from "type-graphql";

import createSchema from "./buildSchema";
import {GraphQLContext} from "./graphqlContext";

interface Options {
  query: string;
  variables?: Maybe<{
    [key: string]: any;
  }>;
  context?: GraphQLContext;
}

let schema: GraphQLSchema;

export const gqlCall = async ({
  query,
  variables,
  context = {clientId: "test-client"},
}: Options) => {
  if (!schema) {
    schema = await createSchema();
  }
  return graphql({
    schema,
    source: query,
    contextValue: context,
    variableValues: variables,
  });
};
