import {GraphQLError} from "graphql";
import React from "react";

type QueryResultsState<TData> = {
  data: TData | null | undefined;
  loading: boolean;
  errors?: ReadonlyArray<Error | GraphQLError>;
};
type QueryResultsAction<TData> = {
  type: "loading" | "data" | "error";
  data?: TData;
  errors?: readonly Error[] | readonly GraphQLError[];
};
function queryResultsReducer<TData>(
  state: QueryResultsState<TData>,
  action: QueryResultsAction<TData>,
) {
  switch (action.type) {
    case "data":
      return {data: action.data, loading: false, errors: undefined};
    case "error":
      return {data: undefined, loading: false, errors: action.errors};
    case "loading":
      return {data: state.data, loading: true, errors: undefined};
    default:
      return state;
  }
}
type ReducerSignature<TData> = (
  state: QueryResultsState<TData>,
  action: QueryResultsAction<TData>,
) => QueryResultsState<TData>;
export default function useQueryResults<TData>() {
  return React.useReducer<ReducerSignature<TData>>(queryResultsReducer, {
    data: undefined,
    loading: true,
    errors: undefined,
  });
}
