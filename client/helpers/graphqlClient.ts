/* istanbul ignore file */

import {
  ApolloClient,
  ApolloLink,
  from,
  HttpLink,
  InMemoryCache,
  split,
} from "@apollo/client";
import {WebSocketLink} from "@apollo/client/link/ws";
import {getMainDefinition} from "@apollo/client/utilities";
import {onError} from "@apollo/client/link/error";
import {setContext} from "@apollo/client/link/context";
import {getClientId} from "./getClientId";
import {createUploadLink} from "apollo-upload-client";

const hostname = window.location.hostname;
const protocol = window.location.protocol;
const wsProtocol = protocol === "https:" ? "wss:" : "ws:";
export const graphqlUrl =
  process.env.NODE_ENV === "production"
    ? "/graphql"
    : `${protocol}//${hostname}:${
        parseInt(window.location.port || "3000", 10) + 1
      }/graphql`;

const websocketUrl =
  process.env.NODE_ENV === "production"
    ? `${wsProtocol}//${window.location.host}/graphql`
    : `${wsProtocol}//${hostname}:${
        parseInt(window.location.port || "3000", 10) + 1
      }/graphql`;

const webSocketLink = new WebSocketLink({
  uri: websocketUrl,
  options: {
    reconnect: true,
    connectionParams: () =>
      getClientId().then(clientId => {
        console.log("GOt connection params");
        return {clientid: clientId};
      }),
  },
});

const wsLink = ApolloLink.from([
  onError(args => {
    const {response, graphQLErrors, networkError} = args;
    if (graphQLErrors) {
      graphQLErrors.forEach(error => {
        const {message, locations, path} = error;
        console.error(
          `[Subscription Error]: Message: ${message}, Location: ${locations}, Path: ${path}`
        );
        // Sentry.captureException(error);
      });
    }

    if (networkError) {
      console.error(`[Network error]: `, networkError);
      // Sentry.captureException(networkError);
    }
    // @ts-ignore
    if (response) response.errors = null;
  }),
  webSocketLink,
]);

const headersMiddleware = setContext((operation, {headers}) => {
  const core = window.location.pathname.includes("/core");
  return getClientId().then(clientId => ({
    headers: {...headers, clientid: clientId, core},
  }));
});

const httpLink = ApolloLink.from([
  onError(({graphQLErrors, networkError}) => {
    if (graphQLErrors) {
      graphQLErrors.map(({message, locations, path}) =>
        console.error(
          `[GraphQL error]: Message: ${message}, Location: ${locations}, Path: ${path}`
        )
      );
    }
    if (networkError) console.error(`[Network error]:`, networkError);
  }),
  (createUploadLink({
    uri: graphqlUrl,
    fetchOptions: {
      mode: "cors",
    },
  }) as unknown) as ApolloLink,
]);

const link = split(
  // split based on operation type
  ({query}) => {
    const definition = getMainDefinition(query);
    return (
      definition.kind === "OperationDefinition" &&
      definition.operation === "subscription"
    );
  },
  wsLink,
  httpLink
);

const client = new ApolloClient({
  link: from([headersMiddleware, link]),
  cache: new InMemoryCache(),
});

export default client;
