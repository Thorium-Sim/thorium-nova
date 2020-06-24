import React from "react";
import {
  OperationVariables,
  SubscriptionHookOptions,
  TSubscriptionResponse,
} from "./utils/types";
import {DocumentNode, GraphQLError} from "graphql";
import create, {StoreApi, UseStore} from "zustand";
import useOperationVariables from "./utils/useOperationVariables";
import {useGraphQLClient} from "./useGraphQLClient";
import getQueryParams from "./utils/getQueryParams";

const serverInterval = 1000 / 5;

export function useTSubscription<TData = any, TVariables = OperationVariables>(
  subscription: DocumentNode,
  options?: SubscriptionHookOptions<TData, TVariables>,
): [
  UseStore<TSubscriptionResponse<TData>>,
  StoreApi<TSubscriptionResponse<TData>>,
  Error[] | readonly GraphQLError[] | undefined,
] {
  const [errors, setErrors] = React.useState<
    Error[] | readonly GraphQLError[] | undefined
  >();
  const [useStore, api] = React.useMemo(
    () =>
      create<TSubscriptionResponse<TData>>(() => ({
        loading: true,
        data: undefined,
        endTime: Date.now() + serverInterval,
      })),
    [],
  );

  const variables = useOperationVariables(options?.variables);
  const client = useGraphQLClient();
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
            api.setState(s => ({
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
  }, [api, document, variables, skip]);

  return [useStore, api, errors];
}
