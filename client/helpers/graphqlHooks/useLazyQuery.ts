import {
  OperationVariables,
  LazyQueryHookOptions,
  FetchResult,
} from "./utils/types";
import {DocumentNode} from "graphql";
import useOperationVariables from "./utils/useOperationVariables";
import getQueryParams from "./utils/getQueryParams";
import {useGraphQLClient} from "./useGraphQLClient";

export function useLazyQuery<TData = any, TVariables = OperationVariables>(
  queryDoc: DocumentNode,
  options?: LazyQueryHookOptions<TData, TVariables>,
): (options?: {variables?: TVariables}) => Promise<FetchResult<TData>> {
  const variables = useOperationVariables(options?.variables);
  const client = useGraphQLClient();

  return function (options) {
    return new Promise((resolve, reject) => {
      const {query, operationName} = getQueryParams(queryDoc);
      client
        .request({
          query,
          operationName,
          variables: options?.variables || variables,
        })
        .subscribe({
          next: ({data, errors}) => {
            if (errors) {
              reject(errors);
            } else {
              resolve({data: data as TData});
            }
          },
          error: error => {
            reject([error]);
          },
        });
    });
  };
}
