import React from "react";
import {
  OperationVariables,
  SubscriptionHookOptions,
  SubscriptionResponse,
} from "./utils/types";
import {DocumentNode} from "graphql";
import useQueryResults from "./utils/useQueryResults";
import useOperationVariables from "./utils/useOperationVariables";
import {useGraphQLClient} from "./useGraphQLClient";
import getQueryParams from "./utils/getQueryParams";

export function useSubscription<TData = any, TVariables = OperationVariables>(
  subscription: DocumentNode,
  options?: SubscriptionHookOptions<TData, TVariables>,
): SubscriptionResponse<TData, TVariables> {
  const [state, dispatch] = useQueryResults<TData>();

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
            dispatch({type: "error", errors});
          } else {
            dispatch({type: "data", data: data as TData});
          }
        },
        error: error => {
          dispatch({type: "error", errors: [error]});
        },
      });
    return () => unsubscribe.unsubscribe();
  }, [document, variables, skip]);

  return {
    variables,
    ...state,
  };
}
