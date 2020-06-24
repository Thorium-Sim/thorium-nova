import {GraphQLError} from "graphql";

export interface TSubscriptionResponse<TData> {
  loading?: boolean;
  data?: TData | null;
  gameState?: TData | null;
  endTime: number;
}
export interface SubscriptionResponse<TData, TVariables> {
  variables: TVariables | undefined;
  loading: boolean;
  data?: TData | null | undefined;
  errors?: readonly Error[] | readonly GraphQLError[];
}
export type OperationVariables = Record<string, any>;

export interface FetchResult<
  TData = {
    [key: string]: any;
  }
> {
  errors?: readonly Error[] | readonly GraphQLError[];
  data?: TData | null;
}

export interface QueryResult<TData> {
  data: TData | null | undefined;
  errors?: readonly Error[] | readonly GraphQLError[];
  loading: boolean;
}

export type QueryHookOptions<TData, TVariables = OperationVariables> = {
  variables?: TVariables;
  skip?: boolean;
};
export type LazyQueryHookOptions<TData, TVariables = OperationVariables> = {
  variables?: TVariables;
};
export type MutationHookOptions<TData, TVariables = OperationVariables> = {
  variables?: TVariables;
};
export type SubscriptionHookOptions<TData, TVariables = OperationVariables> = {
  variables?: TVariables;
  skip?: boolean;
};
