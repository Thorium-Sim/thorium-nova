import React from "react";
import {OperationVariables, QueryHookOptions, QueryResult} from "./utils/types";
import {DocumentNode} from "graphql";
import useQueryResults from "./utils/useQueryResults";
import useOperationVariables from "./utils/useOperationVariables";
import {useGraphQLClient} from "./useGraphQLClient";
import getQueryParams from "./utils/getQueryParams";

export function useQuery<TData = any, TVariables = OperationVariables>(
  queryDoc: DocumentNode,
  options?: QueryHookOptions<TData, TVariables>,
): QueryResult<TData> {
  const [state, dispatch] = useQueryResults<TData>();

  const variables = useOperationVariables(options?.variables);
  const client = useGraphQLClient();
  const skip = options?.skip;

  React.useEffect(() => {
    if (skip) return;
    const {query, operationName} = getQueryParams(queryDoc);
    client
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
  }, [skip, queryDoc, variables, client]);
  return state;
}
