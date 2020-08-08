import * as Apollo from "@apollo/client";
export type Maybe<T> = T | null;
export type Exact<T extends {[key: string]: unknown}> = {[K in keyof T]: T[K]};
const gql = Apollo.gql;
/** All built-in and custom scalars, mapped to their actual values */
export type Scalars = {
  ID: string;
  String: string;
  Boolean: boolean;
  Int: number;
  Float: number;
  /** The javascript `Date` as string. Type represents date and time as the ISO Date string. */
  DateTime: Date;
  /** The `Upload` scalar type represents a file upload. */
  Upload: any;
};

export type PositionInput = {
  x: Maybe<Scalars["Float"]>;
  y: Maybe<Scalars["Float"]>;
  z: Maybe<Scalars["Float"]>;
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

export type TemplateShipAssetsSubscriptionVariables = Exact<{
  id: Scalars["ID"];
}>;

export type TemplateShipAssetsSubscription = {
  __typename?: "Subscription";
  templateShip: Maybe<{
    __typename?: "Entity";
    id: string;
    shipAssets: {
      __typename?: "ShipAssetsComponent";
      logo: string;
      model: string;
      side: string;
      top: string;
      vanity: string;
    };
  }>;
};

export type TemplateShipSetLogoMutationVariables = Exact<{
  id: Scalars["ID"];
  image: Scalars["Upload"];
}>;

export type TemplateShipSetLogoMutation = {
  __typename?: "Mutation";
  templateShipSetLogo: {
    __typename?: "Entity";
    id: string;
    shipAssets: {__typename?: "ShipAssetsComponent"; logo: string};
  };
};

export type TemplateShipSetModelMutationVariables = Exact<{
  id: Scalars["ID"];
  model: Scalars["Upload"];
  side: Scalars["Upload"];
  top: Scalars["Upload"];
  vanity: Scalars["Upload"];
}>;

export type TemplateShipSetModelMutation = {
  __typename?: "Mutation";
  templateShipSetModel: {
    __typename?: "Entity";
    id: string;
    shipAssets: {
      __typename?: "ShipAssetsComponent";
      model: string;
      side: string;
      top: string;
      vanity: string;
    };
  };
};

export type UniverseAddStarMutationVariables = Exact<{
  id: Scalars["ID"];
  position: PositionInput;
}>;

export type UniverseAddStarMutation = {
  __typename?: "Mutation";
  universeTemplateAddStar: {__typename?: "UniverseTemplate"; id: string};
};

export type UniverseStarSetPositionMutationVariables = Exact<{
  id: Scalars["ID"];
  starId: Scalars["ID"];
  position: PositionInput;
}>;

export type UniverseStarSetPositionMutation = {
  __typename?: "Mutation";
  universeTemplateStarSetPosition: {
    __typename?: "UniverseTemplate";
    id: string;
  };
};

export type UniverseSubscriptionVariables = Exact<{
  id: Scalars["ID"];
}>;

export type UniverseSubscription = {
  __typename?: "Subscription";
  universe: Maybe<{
    __typename?: "UniverseTemplate";
    id: string;
    name: string;
    systems: Array<{
      __typename?: "Entity";
      id: string;
      identity: {
        __typename?: "IdentityComponent";
        name: string;
        description: string;
      };
      tags: {__typename?: "TagsComponent"; tags: Array<string>};
      position: {
        __typename?: "PositionComponent";
        x: number;
        y: number;
        z: number;
      };
    }>;
  }>;
};

export type UniverseSetCoverImageMutationVariables = Exact<{
  id: Scalars["ID"];
  image: Scalars["Upload"];
}>;

export type UniverseSetCoverImageMutation = {
  __typename?: "Mutation";
  universeSetCoverImage: {
    __typename?: "UniverseTemplate";
    id: string;
    coverImage: string;
  };
};

export type UniverseSetDescriptionMutationVariables = Exact<{
  id: Scalars["ID"];
  description: Scalars["String"];
}>;

export type UniverseSetDescriptionMutation = {
  __typename?: "Mutation";
  universeSetDescription: {
    __typename?: "UniverseTemplate";
    id: string;
    description: string;
  };
};

export type UniverseSetTagsMutationVariables = Exact<{
  id: Scalars["ID"];
  tags: Array<Scalars["String"]>;
}>;

export type UniverseSetTagsMutation = {
  __typename?: "Mutation";
  universeSetTags: {
    __typename?: "UniverseTemplate";
    id: string;
    tags: Array<string>;
  };
};

export type UniverseCreateMutationVariables = Exact<{
  name: Scalars["String"];
}>;

export type UniverseCreateMutation = {
  __typename?: "Mutation";
  universeCreate: {
    __typename?: "UniverseTemplate";
    id: string;
    name: string;
    author: string;
    description: string;
    coverImage: string;
    tags: Array<string>;
  };
};

export type UniverseRemoveMutationVariables = Exact<{
  id: Scalars["ID"];
}>;

export type UniverseRemoveMutation = {
  __typename?: "Mutation";
  universeRemove: string;
};

export type UniverseSetNameMutationVariables = Exact<{
  id: Scalars["ID"];
  name: Scalars["String"];
}>;

export type UniverseSetNameMutation = {
  __typename?: "Mutation";
  universeSetName: {__typename?: "UniverseTemplate"; id: string; name: string};
};

export type UniversesSubscriptionVariables = Exact<{[key: string]: never}>;

export type UniversesSubscription = {
  __typename?: "Subscription";
  universes: Array<{
    __typename?: "UniverseTemplate";
    id: string;
    name: string;
    author: string;
    description: string;
    coverImage: string;
    tags: Array<string>;
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
  baseOptions?: Apollo.MutationHookOptions<
    TimerPauseMutation,
    TimerPauseMutationVariables
  >
) {
  return Apollo.useMutation<TimerPauseMutation, TimerPauseMutationVariables>(
    TimerPauseDocument,
    baseOptions
  );
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
  baseOptions?: Apollo.MutationHookOptions<
    TimerRemoveMutation,
    TimerRemoveMutationVariables
  >
) {
  return Apollo.useMutation<TimerRemoveMutation, TimerRemoveMutationVariables>(
    TimerRemoveDocument,
    baseOptions
  );
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
  baseOptions?: Apollo.MutationHookOptions<
    TimerCreateMutation,
    TimerCreateMutationVariables
  >
) {
  return Apollo.useMutation<TimerCreateMutation, TimerCreateMutationVariables>(
    TimerCreateDocument,
    baseOptions
  );
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
  baseOptions?: Apollo.SubscriptionHookOptions<
    TimersSubscription,
    TimersSubscriptionVariables
  >
) {
  return Apollo.useSubscription<
    TimersSubscription,
    TimersSubscriptionVariables
  >(TimersDocument, baseOptions);
}
export type TimersSubscriptionHookResult = ReturnType<
  typeof useTimersSubscription
>;
export const TemplateShipAssetsDocument = gql`
  subscription TemplateShipAssets($id: ID!) {
    templateShip(id: $id) {
      id
      shipAssets {
        logo
        model
        side
        top
        vanity
      }
    }
  }
`;
export function useTemplateShipAssetsSubscription(
  baseOptions?: Apollo.SubscriptionHookOptions<
    TemplateShipAssetsSubscription,
    TemplateShipAssetsSubscriptionVariables
  >
) {
  return Apollo.useSubscription<
    TemplateShipAssetsSubscription,
    TemplateShipAssetsSubscriptionVariables
  >(TemplateShipAssetsDocument, baseOptions);
}
export type TemplateShipAssetsSubscriptionHookResult = ReturnType<
  typeof useTemplateShipAssetsSubscription
>;
export const TemplateShipSetLogoDocument = gql`
  mutation TemplateShipSetLogo($id: ID!, $image: Upload!) {
    templateShipSetLogo(id: $id, image: $image) {
      id
      shipAssets {
        logo
      }
    }
  }
`;
export function useTemplateShipSetLogoMutation(
  baseOptions?: Apollo.MutationHookOptions<
    TemplateShipSetLogoMutation,
    TemplateShipSetLogoMutationVariables
  >
) {
  return Apollo.useMutation<
    TemplateShipSetLogoMutation,
    TemplateShipSetLogoMutationVariables
  >(TemplateShipSetLogoDocument, baseOptions);
}
export type TemplateShipSetLogoMutationHookResult = ReturnType<
  typeof useTemplateShipSetLogoMutation
>;
export const TemplateShipSetModelDocument = gql`
  mutation TemplateShipSetModel(
    $id: ID!
    $model: Upload!
    $side: Upload!
    $top: Upload!
    $vanity: Upload!
  ) {
    templateShipSetModel(
      id: $id
      model: $model
      side: $side
      top: $top
      vanity: $vanity
    ) {
      id
      shipAssets {
        model
        side
        top
        vanity
      }
    }
  }
`;
export function useTemplateShipSetModelMutation(
  baseOptions?: Apollo.MutationHookOptions<
    TemplateShipSetModelMutation,
    TemplateShipSetModelMutationVariables
  >
) {
  return Apollo.useMutation<
    TemplateShipSetModelMutation,
    TemplateShipSetModelMutationVariables
  >(TemplateShipSetModelDocument, baseOptions);
}
export type TemplateShipSetModelMutationHookResult = ReturnType<
  typeof useTemplateShipSetModelMutation
>;
export const UniverseAddStarDocument = gql`
  mutation UniverseAddStar($id: ID!, $position: PositionInput!) {
    universeTemplateAddStar(id: $id, position: $position) {
      id
    }
  }
`;
export function useUniverseAddStarMutation(
  baseOptions?: Apollo.MutationHookOptions<
    UniverseAddStarMutation,
    UniverseAddStarMutationVariables
  >
) {
  return Apollo.useMutation<
    UniverseAddStarMutation,
    UniverseAddStarMutationVariables
  >(UniverseAddStarDocument, baseOptions);
}
export type UniverseAddStarMutationHookResult = ReturnType<
  typeof useUniverseAddStarMutation
>;
export const UniverseStarSetPositionDocument = gql`
  mutation UniverseStarSetPosition(
    $id: ID!
    $starId: ID!
    $position: PositionInput!
  ) {
    universeTemplateStarSetPosition(
      id: $id
      starId: $starId
      position: $position
    ) {
      id
    }
  }
`;
export function useUniverseStarSetPositionMutation(
  baseOptions?: Apollo.MutationHookOptions<
    UniverseStarSetPositionMutation,
    UniverseStarSetPositionMutationVariables
  >
) {
  return Apollo.useMutation<
    UniverseStarSetPositionMutation,
    UniverseStarSetPositionMutationVariables
  >(UniverseStarSetPositionDocument, baseOptions);
}
export type UniverseStarSetPositionMutationHookResult = ReturnType<
  typeof useUniverseStarSetPositionMutation
>;
export const UniverseDocument = gql`
  subscription Universe($id: ID!) {
    universe(id: $id) {
      id
      name
      systems {
        id
        identity {
          name
          description
        }
        tags {
          tags
        }
        position {
          x
          y
          z
        }
      }
    }
  }
`;
export function useUniverseSubscription(
  baseOptions?: Apollo.SubscriptionHookOptions<
    UniverseSubscription,
    UniverseSubscriptionVariables
  >
) {
  return Apollo.useSubscription<
    UniverseSubscription,
    UniverseSubscriptionVariables
  >(UniverseDocument, baseOptions);
}
export type UniverseSubscriptionHookResult = ReturnType<
  typeof useUniverseSubscription
>;
export const UniverseSetCoverImageDocument = gql`
  mutation UniverseSetCoverImage($id: ID!, $image: Upload!) {
    universeSetCoverImage(id: $id, image: $image) {
      id
      coverImage
    }
  }
`;
export function useUniverseSetCoverImageMutation(
  baseOptions?: Apollo.MutationHookOptions<
    UniverseSetCoverImageMutation,
    UniverseSetCoverImageMutationVariables
  >
) {
  return Apollo.useMutation<
    UniverseSetCoverImageMutation,
    UniverseSetCoverImageMutationVariables
  >(UniverseSetCoverImageDocument, baseOptions);
}
export type UniverseSetCoverImageMutationHookResult = ReturnType<
  typeof useUniverseSetCoverImageMutation
>;
export const UniverseSetDescriptionDocument = gql`
  mutation UniverseSetDescription($id: ID!, $description: String!) {
    universeSetDescription(id: $id, description: $description) {
      id
      description
    }
  }
`;
export function useUniverseSetDescriptionMutation(
  baseOptions?: Apollo.MutationHookOptions<
    UniverseSetDescriptionMutation,
    UniverseSetDescriptionMutationVariables
  >
) {
  return Apollo.useMutation<
    UniverseSetDescriptionMutation,
    UniverseSetDescriptionMutationVariables
  >(UniverseSetDescriptionDocument, baseOptions);
}
export type UniverseSetDescriptionMutationHookResult = ReturnType<
  typeof useUniverseSetDescriptionMutation
>;
export const UniverseSetTagsDocument = gql`
  mutation UniverseSetTags($id: ID!, $tags: [String!]!) {
    universeSetTags(id: $id, tags: $tags) {
      id
      tags
    }
  }
`;
export function useUniverseSetTagsMutation(
  baseOptions?: Apollo.MutationHookOptions<
    UniverseSetTagsMutation,
    UniverseSetTagsMutationVariables
  >
) {
  return Apollo.useMutation<
    UniverseSetTagsMutation,
    UniverseSetTagsMutationVariables
  >(UniverseSetTagsDocument, baseOptions);
}
export type UniverseSetTagsMutationHookResult = ReturnType<
  typeof useUniverseSetTagsMutation
>;
export const UniverseCreateDocument = gql`
  mutation UniverseCreate($name: String!) {
    universeCreate(name: $name) {
      id
      name
      author
      description
      coverImage
      tags
    }
  }
`;
export function useUniverseCreateMutation(
  baseOptions?: Apollo.MutationHookOptions<
    UniverseCreateMutation,
    UniverseCreateMutationVariables
  >
) {
  return Apollo.useMutation<
    UniverseCreateMutation,
    UniverseCreateMutationVariables
  >(UniverseCreateDocument, baseOptions);
}
export type UniverseCreateMutationHookResult = ReturnType<
  typeof useUniverseCreateMutation
>;
export const UniverseRemoveDocument = gql`
  mutation UniverseRemove($id: ID!) {
    universeRemove(id: $id)
  }
`;
export function useUniverseRemoveMutation(
  baseOptions?: Apollo.MutationHookOptions<
    UniverseRemoveMutation,
    UniverseRemoveMutationVariables
  >
) {
  return Apollo.useMutation<
    UniverseRemoveMutation,
    UniverseRemoveMutationVariables
  >(UniverseRemoveDocument, baseOptions);
}
export type UniverseRemoveMutationHookResult = ReturnType<
  typeof useUniverseRemoveMutation
>;
export const UniverseSetNameDocument = gql`
  mutation UniverseSetName($id: ID!, $name: String!) {
    universeSetName(id: $id, name: $name) {
      id
      name
    }
  }
`;
export function useUniverseSetNameMutation(
  baseOptions?: Apollo.MutationHookOptions<
    UniverseSetNameMutation,
    UniverseSetNameMutationVariables
  >
) {
  return Apollo.useMutation<
    UniverseSetNameMutation,
    UniverseSetNameMutationVariables
  >(UniverseSetNameDocument, baseOptions);
}
export type UniverseSetNameMutationHookResult = ReturnType<
  typeof useUniverseSetNameMutation
>;
export const UniversesDocument = gql`
  subscription Universes {
    universes {
      id
      name
      author
      description
      coverImage
      tags
    }
  }
`;
export function useUniversesSubscription(
  baseOptions?: Apollo.SubscriptionHookOptions<
    UniversesSubscription,
    UniversesSubscriptionVariables
  >
) {
  return Apollo.useSubscription<
    UniversesSubscription,
    UniversesSubscriptionVariables
  >(UniversesDocument, baseOptions);
}
export type UniversesSubscriptionHookResult = ReturnType<
  typeof useUniversesSubscription
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
  baseOptions?: Apollo.MutationHookOptions<
    ClientConnectMutation,
    ClientConnectMutationVariables
  >
) {
  return Apollo.useMutation<
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
  baseOptions?: Apollo.MutationHookOptions<
    ClientDisconnectMutation,
    ClientDisconnectMutationVariables
  >
) {
  return Apollo.useMutation<
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
  baseOptions?: Apollo.MutationHookOptions<
    StartFlightMutation,
    StartFlightMutationVariables
  >
) {
  return Apollo.useMutation<StartFlightMutation, StartFlightMutationVariables>(
    StartFlightDocument,
    baseOptions
  );
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
  baseOptions?: Apollo.QueryHookOptions<FlightsQuery, FlightsQueryVariables>
) {
  return Apollo.useQuery<FlightsQuery, FlightsQueryVariables>(
    FlightsDocument,
    baseOptions
  );
}
export function useFlightsLazyQuery(
  baseOptions?: Apollo.LazyQueryHookOptions<FlightsQuery, FlightsQueryVariables>
) {
  return Apollo.useLazyQuery<FlightsQuery, FlightsQueryVariables>(
    FlightsDocument,
    baseOptions
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
  baseOptions?: Apollo.QueryHookOptions<
    IntrospectionQuery,
    IntrospectionQueryVariables
  >
) {
  return Apollo.useQuery<IntrospectionQuery, IntrospectionQueryVariables>(
    IntrospectionDocument,
    baseOptions
  );
}
export function useIntrospectionLazyQuery(
  baseOptions?: Apollo.LazyQueryHookOptions<
    IntrospectionQuery,
    IntrospectionQueryVariables
  >
) {
  return Apollo.useLazyQuery<IntrospectionQuery, IntrospectionQueryVariables>(
    IntrospectionDocument,
    baseOptions
  );
}
export type IntrospectionQueryHookResult = ReturnType<
  typeof useIntrospectionQuery
>;
export type IntrospectionLazyQueryHookResult = ReturnType<
  typeof useIntrospectionLazyQuery
>;
