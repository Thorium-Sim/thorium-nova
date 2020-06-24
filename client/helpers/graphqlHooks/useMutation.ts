import {
  OperationVariables,
  MutationHookOptions,
  FetchResult,
} from "./utils/types";
import {DocumentNode} from "graphql";
import useOperationVariables from "./utils/useOperationVariables";
import {useGraphQLClient} from "./useGraphQLClient";
import getQueryParams from "./utils/getQueryParams";

export function useMutation<TData = any, TVariables = OperationVariables>(
  mutation: DocumentNode,
  options?: MutationHookOptions<TData, TVariables>,
): (options?: {variables?: TVariables}) => Promise<FetchResult<TData>> {
  const variables = useOperationVariables(options?.variables);
  const client = useGraphQLClient();

  return async function (options) {
    return new Promise((resolve, reject) => {
      const {query, operationName} = getQueryParams(mutation);
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
