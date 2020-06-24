import gql from "graphql-tag";
import * as GraphQLHooks from "c/helpers/graphqlHooks";
export type Maybe<T> = T | null;
export type Exact<T extends {[key: string]: any}> = {[K in keyof T]: T[K]};
/** All built-in and custom scalars, mapped to their actual values */
export type Scalars = {
  ID: string;
  String: string;
  Boolean: boolean;
  Int: number;
  Float: number;
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

export type FlightQueryVariables = Exact<{[key: string]: never}>;

export type FlightQuery = {flight: Maybe<{id: string; name: string}>};

export type IntrospectionQueryQueryVariables = Exact<{[key: string]: never}>;

export type IntrospectionQueryQuery = {
  __schema: {
    mutationType: Maybe<{
      name: Maybe<string>;
      description: Maybe<string>;
      fields: Maybe<Array<{name: string; description: Maybe<string>}>>;
    }>;
  };
};

export type StartFlightMutationVariables = Exact<{[key: string]: never}>;

export type StartFlightMutation = {
  addObject: string;
  flightStart: {id: string; name: string};
};

export type CoordsFragment = {x: number; y: number; z: number};

export type ObjectMovementsSubscriptionVariables = Exact<{
  [key: string]: never;
}>;

export type ObjectMovementsSubscription = {
  objects: Array<{id: string; Position: CoordsFragment}>;
};

export const CoordsFragmentDoc = gql`
  fragment Coords on Coordinate {
    x
    y
    z
  }
`;
export const FlightDocument = gql`
  query Flight {
    flight {
      id
      name
    }
  }
`;
export function useFlightQuery(
  baseOptions?: GraphQLHooks.QueryHookOptions<
    FlightQuery,
    FlightQueryVariables
  >,
) {
  return GraphQLHooks.useQuery<FlightQuery, FlightQueryVariables>(
    FlightDocument,
    baseOptions,
  );
}
export function useFlightLazyQuery(
  baseOptions?: GraphQLHooks.LazyQueryHookOptions<
    FlightQuery,
    FlightQueryVariables
  >,
) {
  return GraphQLHooks.useLazyQuery<FlightQuery, FlightQueryVariables>(
    FlightDocument,
    baseOptions,
  );
}
export type FlightQueryHookResult = ReturnType<typeof useFlightQuery>;
export type FlightLazyQueryHookResult = ReturnType<typeof useFlightLazyQuery>;
export const IntrospectionQueryDocument = gql`
  query IntrospectionQuery {
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
export function useIntrospectionQueryQuery(
  baseOptions?: GraphQLHooks.QueryHookOptions<
    IntrospectionQueryQuery,
    IntrospectionQueryQueryVariables
  >,
) {
  return GraphQLHooks.useQuery<
    IntrospectionQueryQuery,
    IntrospectionQueryQueryVariables
  >(IntrospectionQueryDocument, baseOptions);
}
export function useIntrospectionQueryLazyQuery(
  baseOptions?: GraphQLHooks.LazyQueryHookOptions<
    IntrospectionQueryQuery,
    IntrospectionQueryQueryVariables
  >,
) {
  return GraphQLHooks.useLazyQuery<
    IntrospectionQueryQuery,
    IntrospectionQueryQueryVariables
  >(IntrospectionQueryDocument, baseOptions);
}
export type IntrospectionQueryQueryHookResult = ReturnType<
  typeof useIntrospectionQueryQuery
>;
export type IntrospectionQueryLazyQueryHookResult = ReturnType<
  typeof useIntrospectionQueryLazyQuery
>;
export const StartFlightDocument = gql`
  mutation StartFlight {
    flightStart {
      id
      name
    }
    addObject
  }
`;
export function useStartFlightMutation(
  baseOptions?: GraphQLHooks.MutationHookOptions<
    StartFlightMutation,
    StartFlightMutationVariables
  >,
) {
  return GraphQLHooks.useMutation<
    StartFlightMutation,
    StartFlightMutationVariables
  >(StartFlightDocument, baseOptions);
}
export type StartFlightMutationHookResult = ReturnType<
  typeof useStartFlightMutation
>;
export const ObjectMovementsDocument = gql`
  subscription ObjectMovements {
    objects {
      id
      Position {
        ...Coords
      }
    }
  }
  ${CoordsFragmentDoc}
`;
export function useObjectMovementsSubscription(
  baseOptions?: GraphQLHooks.SubscriptionHookOptions<
    ObjectMovementsSubscription,
    ObjectMovementsSubscriptionVariables
  >,
) {
  return GraphQLHooks.useSubscription<
    ObjectMovementsSubscription,
    ObjectMovementsSubscriptionVariables
  >(ObjectMovementsDocument, baseOptions);
}
export function useObjectMovementsTSubscription(
  baseOptions?: GraphQLHooks.SubscriptionHookOptions<
    ObjectMovementsSubscription,
    ObjectMovementsSubscriptionVariables
  >,
) {
  return GraphQLHooks.useTSubscription<
    ObjectMovementsSubscription,
    ObjectMovementsSubscriptionVariables
  >(ObjectMovementsDocument, baseOptions);
}
export type ObjectMovementsSubscriptionHookResult = ReturnType<
  typeof useObjectMovementsSubscription
>;
export type ObjectMovementsTSubscriptionHookResult = ReturnType<
  typeof useObjectMovementsTSubscription
>;
