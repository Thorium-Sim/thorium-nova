import React from "react";
import {GraphQLHooksContext} from "./GraphQLHooksProvider";

export function useGraphQLClient() {
  const client = React.useContext(GraphQLHooksContext);
  if (client === null)
    throw new Error(
      "Error getting GraphQL Hooks Context. You must wrap your React tree in a GraphQLHooksProvider and pass in a client.",
    );

  return client;
}
