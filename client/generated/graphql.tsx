import gql from "graphql-tag";
import * as ApolloReactCommon from "@apollo/client";
import * as ApolloReactHooks from "@apollo/client";
export type Maybe<T> = T | null;
export type Exact<T extends {[key: string]: any}> = {[K in keyof T]: T[K]};
/** All built-in and custom scalars, mapped to their actual values */
export type Scalars = {
  ID: string;
  String: string;
  Boolean: boolean;
  Int: number;
  Float: number;
  /** The javascript `Date` as string. Type represents date and time as the ISO Date string. */
  DateTime: Date;
};

/** An enum describing what kind of type a given `__Type` is. */
export enum __TypeKind {
  /** Indicates this type is a scalar. */
  Scalar = "SCALAR",
  /** Indicates this type is an object. `fields` and `interfaces` are valid fields. */
  Object = "OBJECT",
  /** Indicates this type is an interface. `fields`, `interfaces`, and `possibleTypes` are valid fields. */
  Interface = "INTERFACE",
  /** Indicates this type is a union. `possibleTypes` is a valid field. */
  Union = "UNION",
  /** Indicates this type is an enum. `enumValues` is a valid field. */
  Enum = "ENUM",
  /** Indicates this type is an input object. `inputFields` is a valid field. */
  InputObject = "INPUT_OBJECT",
  /** Indicates this type is a list. `ofType` is a valid field. */
  List = "LIST",
  /** Indicates this type is a non-null. `ofType` is a valid field. */
  NonNull = "NON_NULL",
}

/** A Directive can be adjacent to many parts of the GraphQL language, a __DirectiveLocation describes one such possible adjacencies. */
export enum __DirectiveLocation {
  /** Location adjacent to a query operation. */
  Query = "QUERY",
  /** Location adjacent to a mutation operation. */
  Mutation = "MUTATION",
  /** Location adjacent to a subscription operation. */
  Subscription = "SUBSCRIPTION",
  /** Location adjacent to a field. */
  Field = "FIELD",
  /** Location adjacent to a fragment definition. */
  FragmentDefinition = "FRAGMENT_DEFINITION",
  /** Location adjacent to a fragment spread. */
  FragmentSpread = "FRAGMENT_SPREAD",
  /** Location adjacent to an inline fragment. */
  InlineFragment = "INLINE_FRAGMENT",
  /** Location adjacent to a variable definition. */
  VariableDefinition = "VARIABLE_DEFINITION",
  /** Location adjacent to a schema definition. */
  Schema = "SCHEMA",
  /** Location adjacent to a scalar definition. */
  Scalar = "SCALAR",
  /** Location adjacent to an object type definition. */
  Object = "OBJECT",
  /** Location adjacent to a field definition. */
  FieldDefinition = "FIELD_DEFINITION",
  /** Location adjacent to an argument definition. */
  ArgumentDefinition = "ARGUMENT_DEFINITION",
  /** Location adjacent to an interface definition. */
  Interface = "INTERFACE",
  /** Location adjacent to a union definition. */
  Union = "UNION",
  /** Location adjacent to an enum definition. */
  Enum = "ENUM",
  /** Location adjacent to an enum value definition. */
  EnumValue = "ENUM_VALUE",
  /** Location adjacent to an input object type definition. */
  InputObject = "INPUT_OBJECT",
  /** Location adjacent to an input object field definition. */
  InputFieldDefinition = "INPUT_FIELD_DEFINITION",
}

export type TimerPauseMutationVariables = Exact<{
  id: Scalars["ID"];
  pause: Scalars["Boolean"];
}>;

export type TimerPauseMutation = {
  __typename?: "Mutation";
  timerPause: Maybe<{__typename?: "Entity"; id: string}>;
};

export type TimerRemoveMutationVariables = Exact<{
  id: Scalars["ID"];
}>;

export type TimerRemoveMutation = {
  __typename?: "Mutation";
  timerRemove: string;
};

export type TimerCreateMutationVariables = Exact<{
  time: Scalars["String"];
  label: Scalars["String"];
}>;

export type TimerCreateMutation = {
  __typename?: "Mutation";
  timerCreate: {
    __typename?: "Entity";
    id: string;
    components: {
      __typename?: "Components";
      timer: {__typename?: "TimerComponent"; label: string; time: string};
    };
  };
};

export type TimersSubscriptionVariables = Exact<{[key: string]: never}>;

export type TimersSubscription = {
  __typename?: "Subscription";
  timers: Array<{
    __typename?: "Entity";
    id: string;
    components: {
      __typename?: "Components";
      timer: {
        __typename?: "TimerComponent";
        time: string;
        label: string;
        paused: boolean;
      };
    };
  }>;
};

export type ClientConnectMutationVariables = Exact<{[key: string]: never}>;

export type ClientConnectMutation = {
  __typename?: "Mutation";
  clientConnect: {__typename?: "Client"; id: string; connected: boolean};
};

export type ClientDisconnectMutationVariables = Exact<{[key: string]: never}>;

export type ClientDisconnectMutation = {
  __typename?: "Mutation";
  clientDisconnect: {__typename?: "Client"; id: string; connected: boolean};
};

export type StartFlightMutationVariables = Exact<{[key: string]: never}>;

export type StartFlightMutation = {
  __typename?: "Mutation";
  flightStart: {__typename?: "Flight"; id: string; name: string};
};

export type FlightsQueryVariables = Exact<{[key: string]: never}>;

export type FlightsQuery = {
  __typename?: "Query";
  flights: Array<{__typename?: "Flight"; id: string; name: string; date: Date}>;
};

export type IntrospectionQueryVariables = Exact<{[key: string]: never}>;

export type IntrospectionQuery = {
  __typename?: "Query";
  __schema: {
    __typename?: "__Schema";
    mutationType: Maybe<{
      __typename?: "__Type";
      name: Maybe<string>;
      description: Maybe<string>;
      fields: Maybe<
        Array<{
          __typename?: "__Field";
          name: string;
          description: Maybe<string>;
        }>
      >;
    }>;
  };
};

export const TimerPauseDocument = gql`
  mutation TimerPause($id: ID!, $pause: Boolean!) {
    timerPause(id: $id, pause: $pause) {
      id
    }
  }
`;
export function useTimerPauseMutation(
  baseOptions?: ApolloReactHooks.MutationHookOptions<
    TimerPauseMutation,
    TimerPauseMutationVariables
  >,
) {
  return ApolloReactHooks.useMutation<
    TimerPauseMutation,
    TimerPauseMutationVariables
  >(TimerPauseDocument, baseOptions);
}
export type TimerPauseMutationHookResult = ReturnType<
  typeof useTimerPauseMutation
>;
export const TimerRemoveDocument = gql`
  mutation TimerRemove($id: ID!) {
    timerRemove(id: $id)
  }
`;
export function useTimerRemoveMutation(
  baseOptions?: ApolloReactHooks.MutationHookOptions<
    TimerRemoveMutation,
    TimerRemoveMutationVariables
  >,
) {
  return ApolloReactHooks.useMutation<
    TimerRemoveMutation,
    TimerRemoveMutationVariables
  >(TimerRemoveDocument, baseOptions);
}
export type TimerRemoveMutationHookResult = ReturnType<
  typeof useTimerRemoveMutation
>;
export const TimerCreateDocument = gql`
  mutation TimerCreate($time: String!, $label: String!) {
    timerCreate(time: $time, label: $label) {
      id
      components {
        timer {
          label
          time
        }
      }
    }
  }
`;
export function useTimerCreateMutation(
  baseOptions?: ApolloReactHooks.MutationHookOptions<
    TimerCreateMutation,
    TimerCreateMutationVariables
  >,
) {
  return ApolloReactHooks.useMutation<
    TimerCreateMutation,
    TimerCreateMutationVariables
  >(TimerCreateDocument, baseOptions);
}
export type TimerCreateMutationHookResult = ReturnType<
  typeof useTimerCreateMutation
>;
export const TimersDocument = gql`
  subscription Timers {
    timers {
      id
      components {
        timer {
          time
          label
          paused
        }
      }
    }
  }
`;
export function useTimersSubscription(
  baseOptions?: ApolloReactHooks.SubscriptionHookOptions<
    TimersSubscription,
    TimersSubscriptionVariables
  >,
) {
  return ApolloReactHooks.useSubscription<
    TimersSubscription,
    TimersSubscriptionVariables
  >(TimersDocument, baseOptions);
}
export type TimersSubscriptionHookResult = ReturnType<
  typeof useTimersSubscription
>;
export const ClientConnectDocument = gql`
  mutation ClientConnect {
    clientConnect {
      id
      connected
    }
  }
`;
export function useClientConnectMutation(
  baseOptions?: ApolloReactHooks.MutationHookOptions<
    ClientConnectMutation,
    ClientConnectMutationVariables
  >,
) {
  return ApolloReactHooks.useMutation<
    ClientConnectMutation,
    ClientConnectMutationVariables
  >(ClientConnectDocument, baseOptions);
}
export type ClientConnectMutationHookResult = ReturnType<
  typeof useClientConnectMutation
>;
export const ClientDisconnectDocument = gql`
  mutation ClientDisconnect {
    clientDisconnect {
      id
      connected
    }
  }
`;
export function useClientDisconnectMutation(
  baseOptions?: ApolloReactHooks.MutationHookOptions<
    ClientDisconnectMutation,
    ClientDisconnectMutationVariables
  >,
) {
  return ApolloReactHooks.useMutation<
    ClientDisconnectMutation,
    ClientDisconnectMutationVariables
  >(ClientDisconnectDocument, baseOptions);
}
export type ClientDisconnectMutationHookResult = ReturnType<
  typeof useClientDisconnectMutation
>;
export const StartFlightDocument = gql`
  mutation StartFlight {
    flightStart {
      id
      name
    }
  }
`;
export function useStartFlightMutation(
  baseOptions?: ApolloReactHooks.MutationHookOptions<
    StartFlightMutation,
    StartFlightMutationVariables
  >,
) {
  return ApolloReactHooks.useMutation<
    StartFlightMutation,
    StartFlightMutationVariables
  >(StartFlightDocument, baseOptions);
}
export type StartFlightMutationHookResult = ReturnType<
  typeof useStartFlightMutation
>;
export const FlightsDocument = gql`
  query Flights {
    flights {
      id
      name
      date
    }
  }
`;
export function useFlightsQuery(
  baseOptions?: ApolloReactHooks.QueryHookOptions<
    FlightsQuery,
    FlightsQueryVariables
  >,
) {
  return ApolloReactHooks.useQuery<FlightsQuery, FlightsQueryVariables>(
    FlightsDocument,
    baseOptions,
  );
}
export function useFlightsLazyQuery(
  baseOptions?: ApolloReactHooks.LazyQueryHookOptions<
    FlightsQuery,
    FlightsQueryVariables
  >,
) {
  return ApolloReactHooks.useLazyQuery<FlightsQuery, FlightsQueryVariables>(
    FlightsDocument,
    baseOptions,
  );
}
export type FlightsQueryHookResult = ReturnType<typeof useFlightsQuery>;
export type FlightsLazyQueryHookResult = ReturnType<typeof useFlightsLazyQuery>;
export const IntrospectionDocument = gql`
  query Introspection {
    __schema {
      mutationType {
        name
        description
        fields {
          name
          description
        }
      }
    }
  }
`;
export function useIntrospectionQuery(
  baseOptions?: ApolloReactHooks.QueryHookOptions<
    IntrospectionQuery,
    IntrospectionQueryVariables
  >,
) {
  return ApolloReactHooks.useQuery<
    IntrospectionQuery,
    IntrospectionQueryVariables
  >(IntrospectionDocument, baseOptions);
}
export function useIntrospectionLazyQuery(
  baseOptions?: ApolloReactHooks.LazyQueryHookOptions<
    IntrospectionQuery,
    IntrospectionQueryVariables
  >,
) {
  return ApolloReactHooks.useLazyQuery<
    IntrospectionQuery,
    IntrospectionQueryVariables
  >(IntrospectionDocument, baseOptions);
}
export type IntrospectionQueryHookResult = ReturnType<
  typeof useIntrospectionQuery
>;
export type IntrospectionLazyQueryHookResult = ReturnType<
  typeof useIntrospectionLazyQuery
>;
