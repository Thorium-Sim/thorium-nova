import React from "react";
import {DocumentNode, GraphQLError, separateOperations, print} from "graphql";
import create, {StoreApi, UseStore} from "zustand";
import {equal} from "@wry/equality";

import {SubscriptionClient} from "subscriptions-transport-ws";

const hostname = window.location.hostname;
const protocol = window.location.protocol;
const wsProtocol = protocol === "https:" ? "wss:" : "ws:";

const websocketUrl =
  process.env.NODE_ENV === "production"
    ? `${wsProtocol}//${window.location.host}/graphql`
    : `${wsProtocol}//${hostname}:${
        parseInt(window.location.port || "3000", 10) + 1
      }/graphql`;

const client = new SubscriptionClient(websocketUrl, {
  reconnect: true,
});

function getQueryParams(document: DocumentNode) {
  const query = print(document);
  const operationName = Object.keys(separateOperations(document))[0];
  return {query, operationName};
}
export interface TSubscriptionResponse<TData> extends Record<string | number | symbol, unknown> {
  loading?: boolean;
  data?: TData | null;
  gameState?: TData | null;
  endTime: number;
}

type OperationVariables = Record<string, any>;

type SubscriptionHookOptions<TData, TVariables = OperationVariables> = {
  variables?: TVariables;
  skip?: boolean;
};

function useOperationVariables<TVariables>(variablesInput?: TVariables) {
  const [variables, setVariables] = React.useState<TVariables | undefined>(
    variablesInput
  );

  React.useEffect(() => {
    if (!equal(variables, variablesInput)) {
      setVariables(variablesInput);
    }
  }, [variables, variablesInput]);

  return variables;
}

const serverInterval = 1000 / 5;

export function useTSubscription<TData = any, TVariables = OperationVariables>(
  subscription: DocumentNode,
  options?: SubscriptionHookOptions<TData, TVariables>
): [
  UseStore<TSubscriptionResponse<TData>>,
  Error[] | readonly GraphQLError[] | undefined
] {
  const [errors, setErrors] = React.useState<
    Error[] | readonly GraphQLError[] | undefined
  >();
  const useStore = React.useMemo(
    () =>
      create<TSubscriptionResponse<TData>>(() => ({
        loading: true,
        data: undefined,
        endTime: Date.now() + serverInterval,
      })),
    []
  );

  const variables = useOperationVariables(options?.variables);
  const skip = options?.skip;

  React.useEffect(() => {
    if (skip) return;
    const {query, operationName} = getQueryParams(subscription);

    const unsubscribe = client
      .request({
        query,
        operationName,
        variables,
      })
      .subscribe({
        next: ({data, errors}) => {
          if (errors) {
            setErrors(errors);
          } else {
            useStore.setState(s => ({
              ...s,
              loading: false,
              data: data as TData,
              gameState: s.gameState || (data as TData),
              endTime: Date.now() + serverInterval,
            }));
          }
        },
        error: error => {
          setErrors([error]);
        },
      });
    return () => unsubscribe.unsubscribe();
  }, [useStore, document, variables, skip]);

  return [useStore, errors];
}
