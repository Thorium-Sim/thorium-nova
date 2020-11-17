import {gql} from "@apollo/client";
import * as Apollo from "@apollo/client";
export type Maybe<T> = T | null;
export type Exact<T extends {[key: string]: unknown}> = {[K in keyof T]: T[K]};
/** All built-in and custom scalars, mapped to their actual values */
export type Scalars = {
  ID: string;
  String: string;
  Boolean: boolean;
  Int: number;
  Float: number;
  /** The `JSON` scalar type represents JSON values as specified by [ECMA-404](http://www.ecma-international.org/publications/files/ECMA-ST/ECMA-404.pdf). */
  JSON: {[key: string]: any};
  /** The javascript `Date` as string. Type represents date and time as the ISO Date string. */
  DateTime: Date;
  /** The `Upload` scalar type represents a file upload. */
  Upload: any;
};

export enum PhraseTypes {
  Word = "word",
  Phrase = "phrase",
  Space = "space",
}

export enum EntityTypes {
  System = "system",
  Planet = "planet",
  Star = "star",
  Ship = "ship",
  Outfit = "outfit",
  Timer = "timer",
}

export type PhraseUnitInput = {
  id: Maybe<Scalars["ID"]>;
  type: Maybe<PhraseTypes>;
  contents: Maybe<Array<Scalars["String"]>>;
};

export type CoordinatesInput = {
  x: Maybe<Scalars["Float"]>;
  y: Maybe<Scalars["Float"]>;
  z: Maybe<Scalars["Float"]>;
};

export type ShipPosition = {
  id: Scalars["ID"];
  position: CoordinatesInput;
};

export type FlightStartSimulator = {
  shipId: Scalars["ID"];
  shipName: Scalars["String"];
  crewCount: Maybe<Scalars["Float"]>;
  stationSet: Maybe<Scalars["ID"]>;
  crewCaptain: Maybe<Scalars["Boolean"]>;
  flightDirector: Scalars["Boolean"];
  missionId: Maybe<Scalars["ID"]>;
  startingPointId: Maybe<Scalars["ID"]>;
};

export enum OutfitAbilities {
  WarpEngines = "warpEngines",
  ImpulseEngines = "impulseEngines",
  Thrusters = "thrusters",
  Navigation = "navigation",
  JumpDrive = "jumpDrive",
  InertialDampeners = "inertialDampeners",
  Generic = "generic",
}

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

export type AvailableShipsQueryVariables = Exact<{[key: string]: never}>;

export type AvailableShipsQuery = {
  __typename?: "Query";
  flight: Maybe<{
    __typename?: "Flight";
    id: string;
    availableShips: Array<{
      __typename?: "Entity";
      id: string;
      isShip: Maybe<{__typename?: "IsShipComponent"; category: string}>;
      identity: {__typename?: "IdentityComponent"; name: string};
      shipAssets: Maybe<{__typename?: "ShipAssetsComponent"; vanity: string}>;
      factionAssignment: Maybe<{
        __typename?: "FactionAssignmentComponent";
        faction: Maybe<{
          __typename?: "Entity";
          id: string;
          identity: {__typename?: "IdentityComponent"; name: string};
          isFaction: {__typename?: "IsFactionComponent"; color: string};
        }>;
      }>;
    }>;
  }>;
};

export type ShipSpawnMutationVariables = Exact<{
  systemId: Scalars["ID"];
  templateId: Scalars["ID"];
  position: CoordinatesInput;
}>;

export type ShipSpawnMutation = {
  __typename?: "Mutation";
  shipSpawn: Maybe<{__typename?: "Entity"; id: string}>;
};

export type UniverseObjectsQueryVariables = Exact<{
  pluginIds: Array<Scalars["ID"]>;
}>;

export type UniverseObjectsQuery = {
  __typename?: "Query";
  pluginUniverseGetPersistentObjects: Array<{
    __typename?: "Entity";
    id: string;
    entityType: EntityTypes;
    identity: {__typename?: "IdentityComponent"; name: string};
    satellite: Maybe<{
      __typename?: "SatelliteComponent";
      parent: Maybe<{
        __typename?: "Entity";
        id: string;
        identity: {__typename?: "IdentityComponent"; name: string};
      }>;
    }>;
    interstellarPosition: Maybe<{
      __typename?: "InterstellarPositionComponent";
      system: Maybe<{
        __typename?: "Entity";
        id: string;
        identity: {__typename?: "IdentityComponent"; name: string};
      }>;
    }>;
  }>;
};

export type AllPluginShipsQueryVariables = Exact<{
  pluginIds: Array<Scalars["ID"]>;
}>;

export type AllPluginShipsQuery = {
  __typename?: "Query";
  allPluginShips: Array<{
    __typename?: "Entity";
    id: string;
    plugin: Maybe<{__typename?: "BasePlugin"; id: string; name: string}>;
    identity: {
      __typename?: "IdentityComponent";
      name: string;
      description: string;
    };
    shipAssets: Maybe<{__typename?: "ShipAssetsComponent"; vanity: string}>;
  }>;
};

export type FlightStopMutationVariables = Exact<{[key: string]: never}>;

export type FlightStopMutation = {
  __typename?: "Mutation";
  flightStop: Maybe<string>;
};

export type FlightPauseMutationVariables = Exact<{[key: string]: never}>;

export type FlightPauseMutation = {
  __typename?: "Mutation";
  flightPause: Maybe<{__typename?: "Flight"; id: string}>;
};

export type FlightResetMutationVariables = Exact<{[key: string]: never}>;

export type FlightResetMutation = {
  __typename?: "Mutation";
  flightReset: Maybe<{__typename?: "Flight"; id: string}>;
};

export type FlightResumeMutationVariables = Exact<{[key: string]: never}>;

export type FlightResumeMutation = {
  __typename?: "Mutation";
  flightResume: Maybe<{__typename?: "Flight"; id: string}>;
};

export type FlightSubscriptionVariables = Exact<{[key: string]: never}>;

export type FlightSubscription = {
  __typename?: "Subscription";
  flight: Maybe<{
    __typename?: "Flight";
    id: string;
    name: string;
    paused: boolean;
    date: Date;
    playerShips: Array<{
      __typename?: "Entity";
      id: string;
      identity: {__typename?: "IdentityComponent"; name: string};
      shipAssets: Maybe<{
        __typename?: "ShipAssetsComponent";
        logo: string;
        vanity: string;
      }>;
    }>;
  }>;
};

export type OutfitAbilitiesQueryVariables = Exact<{[key: string]: never}>;

export type OutfitAbilitiesQuery = {
  __typename?: "Query";
  outfitAbilities: Maybe<{
    __typename?: "__Type";
    enumValues: Maybe<Array<{__typename?: "__EnumValue"; name: string}>>;
  }>;
};

export type PluginAddOutfitMutationVariables = Exact<{
  pluginId: Scalars["ID"];
  ability: OutfitAbilities;
}>;

export type PluginAddOutfitMutation = {
  __typename?: "Mutation";
  pluginAddOutfit: {
    __typename?: "Entity";
    id: string;
    identity: {
      __typename?: "IdentityComponent";
      name: string;
      description: string;
    };
  };
};

export type PluginOutfitRemoveMutationVariables = Exact<{
  pluginId: Scalars["ID"];
  outfitId: Scalars["ID"];
}>;

export type PluginOutfitRemoveMutation = {
  __typename?: "Mutation";
  pluginOutfitRemove: string;
};

export type PluginOutfitSetDescriptionMutationVariables = Exact<{
  pluginId: Scalars["ID"];
  outfitId: Scalars["ID"];
  description: Scalars["String"];
}>;

export type PluginOutfitSetDescriptionMutation = {
  __typename?: "Mutation";
  pluginOutfitSetDescription: {
    __typename?: "Entity";
    id: string;
    identity: {__typename?: "IdentityComponent"; description: string};
  };
};

export type PluginOutfitSetNameMutationVariables = Exact<{
  pluginId: Scalars["ID"];
  outfitId: Scalars["ID"];
  name: Scalars["String"];
}>;

export type PluginOutfitSetNameMutation = {
  __typename?: "Mutation";
  pluginOutfitSetName: {
    __typename?: "Entity";
    id: string;
    identity: {__typename?: "IdentityComponent"; name: string};
  };
};

export type PluginOutfitSetTagsMutationVariables = Exact<{
  pluginId: Scalars["ID"];
  outfitId: Scalars["ID"];
  tags: Array<Scalars["String"]>;
}>;

export type PluginOutfitSetTagsMutation = {
  __typename?: "Mutation";
  pluginOutfitSetTags: {
    __typename?: "Entity";
    id: string;
    tags: {__typename?: "TagsComponent"; tags: Array<string>};
  };
};

export type PluginOutfitSubscriptionVariables = Exact<{
  pluginId: Scalars["ID"];
  outfitId: Scalars["ID"];
}>;

export type PluginOutfitSubscription = {
  __typename?: "Subscription";
  pluginOutfit: Maybe<{
    __typename?: "Entity";
    id: string;
    identity: {
      __typename?: "IdentityComponent";
      name: string;
      description: string;
    };
    isOutfit: {__typename?: "IsOutfitComponent"; outfitType: string};
    tags: {__typename?: "TagsComponent"; tags: Array<string>};
    power: Maybe<{__typename?: "PowerComponent"; value: boolean}>;
    damage: Maybe<{__typename?: "DamageComponent"; value: boolean}>;
    efficiency: Maybe<{__typename?: "EfficiencyComponent"; value: boolean}>;
    heat: Maybe<{__typename?: "HeatComponent"; value: boolean}>;
    trainingMode: Maybe<{__typename?: "TrainingModeComponent"; value: boolean}>;
  }>;
};

export type PluginOutfitsSubscriptionVariables = Exact<{
  pluginId: Scalars["ID"];
}>;

export type PluginOutfitsSubscription = {
  __typename?: "Subscription";
  pluginOutfits: Array<{
    __typename?: "Entity";
    id: string;
    identity: {__typename?: "IdentityComponent"; name: string};
    isOutfit: {__typename?: "IsOutfitComponent"; outfitType: string};
  }>;
};

export type ImpulseEnginesSetCruisingSpeedMutationVariables = Exact<{
  pluginId: Maybe<Scalars["ID"]>;
  outfitId: Maybe<Scalars["ID"]>;
  shipId: Maybe<Scalars["ID"]>;
  speed: Scalars["Float"];
}>;

export type ImpulseEnginesSetCruisingSpeedMutation = {
  __typename?: "Mutation";
  impulseEnginesSetCruisingSpeed: {__typename?: "Entity"; id: string};
};

export type ImpulseEnginesSetEmergencySpeedMutationVariables = Exact<{
  pluginId: Maybe<Scalars["ID"]>;
  outfitId: Maybe<Scalars["ID"]>;
  shipId: Maybe<Scalars["ID"]>;
  speed: Scalars["Float"];
}>;

export type ImpulseEnginesSetEmergencySpeedMutation = {
  __typename?: "Mutation";
  impulseEnginesSetEmergencySpeed: {__typename?: "Entity"; id: string};
};

export type ImpulseEnginesSetThrustMutationVariables = Exact<{
  pluginId: Maybe<Scalars["ID"]>;
  outfitId: Maybe<Scalars["ID"]>;
  shipId: Maybe<Scalars["ID"]>;
  thrust: Scalars["Float"];
}>;

export type ImpulseEnginesSetThrustMutation = {
  __typename?: "Mutation";
  impulseEnginesSetThrust: {__typename?: "Entity"; id: string};
};

export type ImpulseEnginesSubscriptionVariables = Exact<{
  pluginId: Maybe<Scalars["ID"]>;
  outfitId: Maybe<Scalars["ID"]>;
  shipId: Maybe<Scalars["ID"]>;
}>;

export type ImpulseEnginesSubscription = {
  __typename?: "Subscription";
  impulseEnginesOutfit: Maybe<{
    __typename?: "Entity";
    id: string;
    impulseEngines: {
      __typename?: "ImpulseEnginesComponent";
      cruisingSpeed: number;
      emergencySpeed: number;
      thrust: number;
      targetSpeed: number;
    };
  }>;
};

export type NavigationSetDestinationRadiusMutationVariables = Exact<{
  pluginId: Maybe<Scalars["ID"]>;
  outfitId: Maybe<Scalars["ID"]>;
  shipId: Maybe<Scalars["ID"]>;
  radius: Scalars["Float"];
}>;

export type NavigationSetDestinationRadiusMutation = {
  __typename?: "Mutation";
  navigationSetMaxDestinationRadius: {__typename?: "Entity"; id: string};
};

export type NavigationOutfitSubscriptionVariables = Exact<{
  pluginId: Maybe<Scalars["ID"]>;
  outfitId: Maybe<Scalars["ID"]>;
  shipId: Maybe<Scalars["ID"]>;
}>;

export type NavigationOutfitSubscription = {
  __typename?: "Subscription";
  navigationOutfit: Maybe<{
    __typename?: "Entity";
    id: string;
    navigation: {
      __typename?: "NavigationComponent";
      maxDestinationRadius: number;
    };
  }>;
};

export type ThrustersSetDirectionMaxSpeedMutationVariables = Exact<{
  pluginId: Maybe<Scalars["ID"]>;
  outfitId: Maybe<Scalars["ID"]>;
  shipId: Maybe<Scalars["ID"]>;
  speed: Scalars["Float"];
}>;

export type ThrustersSetDirectionMaxSpeedMutation = {
  __typename?: "Mutation";
  thrustersSetDirectionMaxSpeed: {__typename?: "Entity"; id: string};
};

export type ThrustersSetDirectionThrustMutationVariables = Exact<{
  pluginId: Maybe<Scalars["ID"]>;
  outfitId: Maybe<Scalars["ID"]>;
  shipId: Maybe<Scalars["ID"]>;
  thrust: Scalars["Float"];
}>;

export type ThrustersSetDirectionThrustMutation = {
  __typename?: "Mutation";
  thrustersSetDirectionThrust: {__typename?: "Entity"; id: string};
};

export type ThrustersSetRotationMaxSpeedMutationVariables = Exact<{
  pluginId: Maybe<Scalars["ID"]>;
  outfitId: Maybe<Scalars["ID"]>;
  shipId: Maybe<Scalars["ID"]>;
  speed: Scalars["Float"];
}>;

export type ThrustersSetRotationMaxSpeedMutation = {
  __typename?: "Mutation";
  thrustersSetRotationMaxSpeed: {__typename?: "Entity"; id: string};
};

export type ThrustersSetRotationThrustMutationVariables = Exact<{
  pluginId: Maybe<Scalars["ID"]>;
  outfitId: Maybe<Scalars["ID"]>;
  shipId: Maybe<Scalars["ID"]>;
  thrust: Scalars["Float"];
}>;

export type ThrustersSetRotationThrustMutation = {
  __typename?: "Mutation";
  thrustersSetRotationThrust: {__typename?: "Entity"; id: string};
};

export type ThrustersSubscriptionVariables = Exact<{
  pluginId: Maybe<Scalars["ID"]>;
  outfitId: Maybe<Scalars["ID"]>;
  shipId: Maybe<Scalars["ID"]>;
}>;

export type ThrustersSubscription = {
  __typename?: "Subscription";
  thrustersOutfit: Maybe<{
    __typename?: "Entity";
    id: string;
    thrusters: {
      __typename?: "ThrustersComponent";
      directionMaxSpeed: number;
      directionThrust: number;
      rotationMaxSpeed: number;
      rotationThrust: number;
    };
  }>;
};

export type WarpEnginesSetWarpFactorCountMutationVariables = Exact<{
  pluginId: Maybe<Scalars["ID"]>;
  outfitId: Maybe<Scalars["ID"]>;
  shipId: Maybe<Scalars["ID"]>;
  count: Scalars["Int"];
}>;

export type WarpEnginesSetWarpFactorCountMutation = {
  __typename?: "Mutation";
  warpEngineSetWarpFactorCount: {__typename?: "Entity"; id: string};
};

export type WarpEnginesSubscriptionVariables = Exact<{
  pluginId: Maybe<Scalars["ID"]>;
  outfitId: Maybe<Scalars["ID"]>;
  shipId: Maybe<Scalars["ID"]>;
}>;

export type WarpEnginesSubscription = {
  __typename?: "Subscription";
  warpEnginesOutfit: Maybe<{
    __typename?: "Entity";
    id: string;
    warpEngines: {
      __typename?: "WarpEnginesComponent";
      warpFactorCount: number;
      currentWarpFactor: number;
      minSpeedMultiplier: number;
      planetaryCruisingSpeed: number;
      interstellarCruisingSpeed: number;
    };
  }>;
};

export type PhraseCreateMutationVariables = Exact<{
  pluginId: Scalars["ID"];
  name: Scalars["String"];
}>;

export type PhraseCreateMutation = {
  __typename?: "Mutation";
  phraseCreate: {__typename?: "Phrase"; id: string; name: string};
};

export type PhraseListsSubscriptionVariables = Exact<{
  pluginId: Scalars["ID"];
}>;

export type PhraseListsSubscription = {
  __typename?: "Subscription";
  phrases: Array<{
    __typename?: "Phrase";
    id: string;
    name: string;
    category: string;
    units: Array<{
      __typename?: "PhraseUnit";
      id: Maybe<string>;
      type: PhraseTypes;
      contents: Array<string>;
    }>;
  }>;
};

export type PhraseParseQueryVariables = Exact<{
  phraseId: Scalars["ID"];
}>;

export type PhraseParseQuery = {__typename?: "Query"; phraseParse: string};

export type PhraseRemoveMutationVariables = Exact<{
  pluginId: Scalars["ID"];
  id: Scalars["ID"];
}>;

export type PhraseRemoveMutation = {
  __typename?: "Mutation";
  phraseRemove: string;
};

export type PhraseCategoryMutationVariables = Exact<{
  pluginId: Scalars["ID"];
  phraseId: Scalars["ID"];
  category: Scalars["String"];
}>;

export type PhraseCategoryMutation = {
  __typename?: "Mutation";
  phraseSetCategory: {__typename?: "Phrase"; id: string; category: string};
};

export type PhraseSetUnitsMutationVariables = Exact<{
  pluginId: Scalars["ID"];
  phraseId: Scalars["ID"];
  units: Array<PhraseUnitInput>;
}>;

export type PhraseSetUnitsMutation = {
  __typename?: "Mutation";
  phraseSetContents: {__typename?: "Phrase"; id: string};
};

export type PhraseSetNameMutationVariables = Exact<{
  pluginId: Scalars["ID"];
  phraseId: Scalars["ID"];
  name: Scalars["String"];
}>;

export type PhraseSetNameMutation = {
  __typename?: "Mutation";
  phraseSetName: {__typename?: "Phrase"; id: string; name: string};
};

export type TemplateShipAssetsSubscriptionVariables = Exact<{
  pluginId: Scalars["ID"];
  id: Scalars["ID"];
}>;

export type TemplateShipAssetsSubscription = {
  __typename?: "Subscription";
  pluginShip: Maybe<{
    __typename?: "Entity";
    id: string;
    shipAssets: Maybe<{
      __typename?: "ShipAssetsComponent";
      logo: string;
      model: string;
      side: string;
      top: string;
      vanity: string;
    }>;
  }>;
};

export type TemplateShipSetLogoMutationVariables = Exact<{
  id: Scalars["ID"];
  pluginId: Scalars["ID"];
  image: Scalars["Upload"];
}>;

export type TemplateShipSetLogoMutation = {
  __typename?: "Mutation";
  pluginShipSetLogo: {
    __typename?: "Entity";
    id: string;
    shipAssets: Maybe<{__typename?: "ShipAssetsComponent"; logo: string}>;
  };
};

export type TemplateShipSetModelMutationVariables = Exact<{
  id: Scalars["ID"];
  pluginId: Scalars["ID"];
  model: Scalars["Upload"];
  side: Scalars["Upload"];
  top: Scalars["Upload"];
  vanity: Scalars["Upload"];
}>;

export type TemplateShipSetModelMutation = {
  __typename?: "Mutation";
  pluginShipSetModel: {
    __typename?: "Entity";
    id: string;
    shipAssets: Maybe<{
      __typename?: "ShipAssetsComponent";
      model: string;
      side: string;
      top: string;
      vanity: string;
    }>;
  };
};

export type PluginShipAddOutfitMutationVariables = Exact<{
  pluginId: Scalars["ID"];
  shipId: Scalars["ID"];
  outfitId: Scalars["ID"];
}>;

export type PluginShipAddOutfitMutation = {
  __typename?: "Mutation";
  pluginShipAddOutfit: {__typename?: "Entity"; id: string};
};

export type AllPluginOutfitsQueryVariables = Exact<{[key: string]: never}>;

export type AllPluginOutfitsQuery = {
  __typename?: "Query";
  allPluginOutfits: Array<{
    __typename?: "PluginEntity";
    id: string;
    pluginId: string;
    pluginName: string;
    identity: {
      __typename?: "IdentityComponent";
      name: string;
      description: string;
    };
    isOutfit: {__typename?: "IsOutfitComponent"; outfitType: string};
  }>;
};

export type PluginShipBasicSubscriptionVariables = Exact<{
  pluginId: Scalars["ID"];
  shipId: Scalars["ID"];
}>;

export type PluginShipBasicSubscription = {
  __typename?: "Subscription";
  pluginShip: Maybe<{
    __typename?: "Entity";
    id: string;
    identity: {
      __typename?: "IdentityComponent";
      name: string;
      description: string;
    };
    isShip: Maybe<{
      __typename?: "IsShipComponent";
      category: string;
      nameGeneratorPhrase: Maybe<string>;
    }>;
    tags: {__typename?: "TagsComponent"; tags: Array<string>};
  }>;
};

export type PluginShipCreateMutationVariables = Exact<{
  pluginId: Scalars["ID"];
  name: Scalars["String"];
}>;

export type PluginShipCreateMutation = {
  __typename?: "Mutation";
  pluginShipCreate: {__typename?: "Entity"; id: string};
};

export type PluginShipOutfitsSubscriptionVariables = Exact<{
  pluginId: Scalars["ID"];
  shipId: Scalars["ID"];
}>;

export type PluginShipOutfitsSubscription = {
  __typename?: "Subscription";
  pluginShip: Maybe<{
    __typename?: "Entity";
    id: string;
    shipOutfits: {
      __typename?: "ShipOutfitsComponent";
      outfitIds: Array<string>;
      outfits: Array<{
        __typename?: "Entity";
        id: string;
        isOutfit: {__typename?: "IsOutfitComponent"; outfitType: string};
        identity: {__typename?: "IdentityComponent"; name: string};
      }>;
    };
  }>;
};

export type PluginShipPhysicsSubscriptionVariables = Exact<{
  shipId: Scalars["ID"];
  pluginId?: Maybe<Scalars["ID"]>;
}>;

export type PluginShipPhysicsSubscription = {
  __typename?: "Subscription";
  pluginShip: Maybe<{
    __typename?: "Entity";
    id: string;
    isShip: Maybe<{__typename?: "IsShipComponent"; mass: number}>;
    size: Maybe<{__typename?: "SizeComponent"; value: number}>;
  }>;
};

export type PluginShipRemoveMutationVariables = Exact<{
  pluginId: Scalars["ID"];
  shipId: Scalars["ID"];
}>;

export type PluginShipRemoveMutation = {
  __typename?: "Mutation";
  pluginShipRemove: string;
};

export type PluginShipRemoveOutfitMutationVariables = Exact<{
  pluginId: Scalars["ID"];
  shipId: Scalars["ID"];
  outfitId: Scalars["ID"];
}>;

export type PluginShipRemoveOutfitMutation = {
  __typename?: "Mutation";
  pluginShipRemoveOutfit: {__typename?: "Entity"; id: string};
};

export type PluginShipSetCategoryMutationVariables = Exact<{
  pluginId: Scalars["ID"];
  shipId: Scalars["ID"];
  category: Scalars["String"];
}>;

export type PluginShipSetCategoryMutation = {
  __typename?: "Mutation";
  pluginShipSetCategory: {__typename?: "Entity"; id: string};
};

export type PluginShipSetDescriptionMutationVariables = Exact<{
  pluginId: Scalars["ID"];
  shipId: Scalars["ID"];
  description: Scalars["String"];
}>;

export type PluginShipSetDescriptionMutation = {
  __typename?: "Mutation";
  pluginShipSetDescription: {
    __typename?: "Entity";
    id: string;
    identity: {__typename?: "IdentityComponent"; description: string};
  };
};

export type PluginShipSetMassMutationVariables = Exact<{
  pluginId: Scalars["ID"];
  shipId: Scalars["ID"];
  mass: Scalars["Float"];
}>;

export type PluginShipSetMassMutation = {
  __typename?: "Mutation";
  pluginShipSetMass: {__typename?: "Entity"; id: string};
};

export type PluginShipSetNameMutationVariables = Exact<{
  pluginId: Scalars["ID"];
  shipId: Scalars["ID"];
  name: Scalars["String"];
}>;

export type PluginShipSetNameMutation = {
  __typename?: "Mutation";
  pluginShipSetName: {
    __typename?: "Entity";
    id: string;
    identity: {__typename?: "IdentityComponent"; name: string};
  };
};

export type PluginShipSetNameGeneratorPhraseMutationVariables = Exact<{
  pluginId: Scalars["ID"];
  shipId: Scalars["ID"];
  phraseId: Maybe<Scalars["ID"]>;
}>;

export type PluginShipSetNameGeneratorPhraseMutation = {
  __typename?: "Mutation";
  pluginShipSetNameGeneratorPhrase: {__typename?: "Entity"; id: string};
};

export type PluginShipSetSizeMutationVariables = Exact<{
  pluginId: Scalars["ID"];
  shipId: Scalars["ID"];
  size: Scalars["Float"];
}>;

export type PluginShipSetSizeMutation = {
  __typename?: "Mutation";
  pluginShipSetSize: {__typename?: "Entity"; id: string};
};

export type PluginShipSetTagsMutationVariables = Exact<{
  pluginId: Scalars["ID"];
  shipId: Scalars["ID"];
  tags: Array<Scalars["String"]>;
}>;

export type PluginShipSetTagsMutation = {
  __typename?: "Mutation";
  pluginShipSetTags: {
    __typename?: "Entity";
    id: string;
    tags: {__typename?: "TagsComponent"; tags: Array<string>};
  };
};

export type PluginShipsSubscriptionVariables = Exact<{
  pluginId: Scalars["ID"];
}>;

export type PluginShipsSubscription = {
  __typename?: "Subscription";
  pluginShips: Array<{
    __typename?: "Entity";
    id: string;
    identity: {__typename?: "IdentityComponent"; name: string};
    isShip: Maybe<{__typename?: "IsShipComponent"; category: string}>;
  }>;
};

export type PluginCreateMutationVariables = Exact<{
  name: Scalars["String"];
}>;

export type PluginCreateMutation = {
  __typename?: "Mutation";
  pluginCreate: {
    __typename?: "BasePlugin";
    id: string;
    name: string;
    author: string;
    description: string;
    coverImage: string;
    tags: Array<string>;
  };
};

export type PluginRemoveMutationVariables = Exact<{
  id: Scalars["ID"];
}>;

export type PluginRemoveMutation = {
  __typename?: "Mutation";
  pluginRemove: string;
};

export type PluginSetNameMutationVariables = Exact<{
  id: Scalars["ID"];
  name: Scalars["String"];
}>;

export type PluginSetNameMutation = {
  __typename?: "Mutation";
  pluginSetName: {__typename?: "BasePlugin"; id: string; name: string};
};

export type PluginSetCoverImageMutationVariables = Exact<{
  id: Scalars["ID"];
  image: Scalars["Upload"];
}>;

export type PluginSetCoverImageMutation = {
  __typename?: "Mutation";
  pluginSetCoverImage: {
    __typename?: "BasePlugin";
    id: string;
    coverImage: string;
  };
};

export type PluginSetDescriptionMutationVariables = Exact<{
  id: Scalars["ID"];
  description: Scalars["String"];
}>;

export type PluginSetDescriptionMutation = {
  __typename?: "Mutation";
  pluginSetDescription: {
    __typename?: "BasePlugin";
    id: string;
    description: string;
  };
};

export type PluginSetTagsMutationVariables = Exact<{
  id: Scalars["ID"];
  tags: Array<Scalars["String"]>;
}>;

export type PluginSetTagsMutation = {
  __typename?: "Mutation";
  pluginSetTags: {__typename?: "BasePlugin"; id: string; tags: Array<string>};
};

export type PluginsSubscriptionVariables = Exact<{[key: string]: never}>;

export type PluginsSubscription = {
  __typename?: "Subscription";
  plugins: Array<{
    __typename?: "BasePlugin";
    id: string;
    name: string;
    author: string;
    description: string;
    coverImage: string;
    tags: Array<string>;
  }>;
};

export type ShipsSetDesiredDestinationMutationVariables = Exact<{
  shipPositions: Array<ShipPosition>;
}>;

export type ShipsSetDesiredDestinationMutation = {
  __typename?: "Mutation";
  shipsSetDesiredDestination: Maybe<Array<{__typename?: "Entity"; id: string}>>;
};

export type ShipsSetPositionMutationVariables = Exact<{
  shipPositions: Array<ShipPosition>;
}>;

export type ShipsSetPositionMutation = {
  __typename?: "Mutation";
  shipsSetPosition: Maybe<Array<{__typename?: "Entity"; id: string}>>;
};

export type SatelliteComponentFragment = {
  __typename?: "SatelliteComponent";
  distance: number;
  axialTilt: number;
  showOrbit: boolean;
  orbitalArc: number;
  eccentricity: number;
  orbitalInclination: number;
};

export type UniverseObjectFragment = {
  __typename?: "Entity";
  id: string;
  identity: {
    __typename?: "IdentityComponent";
    name: string;
    description: string;
  };
  tags: {__typename?: "TagsComponent"; tags: Array<string>};
  isStar: Maybe<{
    __typename?: "IsStarComponent";
    age: number;
    hue: number;
    isWhite: boolean;
    solarMass: number;
    spectralType: string;
    radius: number;
  }>;
  isPlanet: Maybe<{
    __typename?: "IsPlanetComponent";
    age: number;
    classification: string;
    radius: number;
    terranMass: number;
    habitable: boolean;
    lifeforms: string;
    textureMapAsset: string;
    cloudsMapAsset: string;
    ringsMapAsset: string;
  }>;
  isShip: Maybe<{__typename?: "IsShipComponent"; category: string}>;
  size: Maybe<{__typename?: "SizeComponent"; value: number}>;
  shipAssets: Maybe<{__typename?: "ShipAssetsComponent"; model: string}>;
  satellite: Maybe<
    {__typename?: "SatelliteComponent"} & SatelliteComponentFragment
  >;
  position: Maybe<{
    __typename?: "PositionComponent";
    x: number;
    y: number;
    z: number;
  }>;
  rotation: Maybe<{
    __typename?: "RotationComponent";
    x: number;
    y: number;
    z: number;
    w: number;
  }>;
  temperature: Maybe<{
    __typename?: "TemperatureComponent";
    temperature: number;
  }>;
  population: Maybe<{__typename?: "PopulationComponent"; count: number}>;
};

export type UniversePlanetAssetsSubscriptionVariables = Exact<{
  id: Scalars["ID"];
  objectId: Scalars["ID"];
}>;

export type UniversePlanetAssetsSubscription = {
  __typename?: "Subscription";
  pluginUniverseObject: {
    __typename?: "Entity";
    id: string;
    isPlanet: Maybe<{
      __typename?: "IsPlanetComponent";
      textureMapAsset: string;
      cloudsMapAsset: string;
      ringsMapAsset: string;
    }>;
  };
};

export type PlanetTypesQueryVariables = Exact<{[key: string]: never}>;

export type PlanetTypesQuery = {
  __typename?: "Query";
  planetTypes: Array<{
    __typename?: "PlanetType";
    id: string;
    name: string;
    classification: string;
  }>;
};

export type StarTypesQueryVariables = Exact<{[key: string]: never}>;

export type StarTypesQuery = {
  __typename?: "Query";
  starTypes: Array<{
    __typename?: "StarType";
    id: string;
    name: string;
    spectralType: string;
    prevalence: number;
  }>;
};

export type UniverseAddMoonMutationVariables = Exact<{
  id: Scalars["ID"];
  parentId: Scalars["ID"];
  classification: Scalars["String"];
}>;

export type UniverseAddMoonMutation = {
  __typename?: "Mutation";
  pluginUniverseAddMoon: {__typename?: "Entity"; id: string};
};

export type UniverseAddPlanetMutationVariables = Exact<{
  id: Scalars["ID"];
  parentId: Scalars["ID"];
  classification: Scalars["String"];
}>;

export type UniverseAddPlanetMutation = {
  __typename?: "Mutation";
  pluginUniverseAddPlanet: {__typename?: "Entity"; id: string};
};

export type UniverseAddStarMutationVariables = Exact<{
  id: Scalars["ID"];
  systemId: Scalars["ID"];
  spectralType: Scalars["String"];
}>;

export type UniverseAddStarMutation = {
  __typename?: "Mutation";
  pluginUniverseAddStar: {__typename?: "Entity"; id: string};
};

export type UniverseAddSystemMutationVariables = Exact<{
  id: Scalars["ID"];
  position: PositionInput;
}>;

export type UniverseAddSystemMutation = {
  __typename?: "Mutation";
  pluginUniverseAddSystem: {
    __typename?: "Entity";
    id: string;
    identity: {
      __typename?: "IdentityComponent";
      name: string;
      description: string;
    };
    tags: {__typename?: "TagsComponent"; tags: Array<string>};
    position: Maybe<{
      __typename?: "PositionComponent";
      x: number;
      y: number;
      z: number;
    }>;
  };
};

export type UniverseGetObjectQueryVariables = Exact<{
  id: Scalars["ID"];
  objectId: Scalars["ID"];
}>;

export type UniverseGetObjectQuery = {
  __typename?: "Query";
  pluginUniverseObject: {
    __typename?: "Entity";
    satellite: Maybe<
      {
        __typename?: "SatelliteComponent";
        satellites: Maybe<
          Array<{__typename?: "Entity"} & UniverseObjectFragment>
        >;
        parent: Maybe<{
          __typename?: "Entity";
          id: string;
          entityType: EntityTypes;
          satellite: Maybe<
            {
              __typename?: "SatelliteComponent";
              parent: Maybe<{__typename?: "Entity"; id: string}>;
            } & SatelliteComponentFragment
          >;
        }>;
      } & SatelliteComponentFragment
    >;
  } & UniverseObjectFragment;
};

export type UniverseGetSystemQueryVariables = Exact<{
  id: Scalars["ID"];
  systemId: Scalars["ID"];
}>;

export type UniverseGetSystemQuery = {
  __typename?: "Query";
  pluginUniverseSystem: {
    __typename?: "PlanetarySystem";
    id: string;
    identity: {
      __typename?: "IdentityComponent";
      name: string;
      description: string;
    };
    tags: {__typename?: "TagsComponent"; tags: Array<string>};
    position: Maybe<{
      __typename?: "PositionComponent";
      x: number;
      y: number;
      z: number;
    }>;
    planetarySystem: Maybe<{
      __typename?: "PlanetarySystemComponent";
      skyboxKey: string;
    }>;
  };
};

export type UniverseObjectRemoveMutationVariables = Exact<{
  id: Scalars["ID"];
  objectId: Scalars["ID"];
}>;

export type UniverseObjectRemoveMutation = {
  __typename?: "Mutation";
  pluginUniverseRemoveObject: string;
};

export type UniversePlanetClearCloudsMutationVariables = Exact<{
  id: Scalars["ID"];
  objectId: Scalars["ID"];
}>;

export type UniversePlanetClearCloudsMutation = {
  __typename?: "Mutation";
  pluginUniversePlanetClearClouds: {__typename?: "Entity"; id: string};
};

export type UniversePlanetClearRingsMutationVariables = Exact<{
  id: Scalars["ID"];
  objectId: Scalars["ID"];
}>;

export type UniversePlanetClearRingsMutation = {
  __typename?: "Mutation";
  pluginUniversePlanetClearRings: {__typename?: "Entity"; id: string};
};

export type UniversePlanetSetAgeMutationVariables = Exact<{
  id: Scalars["ID"];
  objectId: Scalars["ID"];
  age: Scalars["Float"];
}>;

export type UniversePlanetSetAgeMutation = {
  __typename?: "Mutation";
  pluginUniversePlanetSetAge: {__typename?: "Entity"; id: string};
};

export type UniversePlanetSetCloudsMutationVariables = Exact<{
  id: Scalars["ID"];
  objectId: Scalars["ID"];
  image: Scalars["Upload"];
}>;

export type UniversePlanetSetCloudsMutation = {
  __typename?: "Mutation";
  pluginUniversePlanetSetClouds: {__typename?: "Entity"; id: string};
};

export type UniversePlanetSetHabitableMutationVariables = Exact<{
  id: Scalars["ID"];
  objectId: Scalars["ID"];
  habitable: Scalars["Boolean"];
}>;

export type UniversePlanetSetHabitableMutation = {
  __typename?: "Mutation";
  pluginUniversePlanetSetHabitable: {__typename?: "Entity"; id: string};
};

export type UniversePlanetSetLifeformsMutationVariables = Exact<{
  id: Scalars["ID"];
  objectId: Scalars["ID"];
  lifeforms: Scalars["String"];
}>;

export type UniversePlanetSetLifeformsMutation = {
  __typename?: "Mutation";
  pluginUniversePlanetSetLifeforms: {__typename?: "Entity"; id: string};
};

export type UniversePlanetSetRadiusMutationVariables = Exact<{
  id: Scalars["ID"];
  objectId: Scalars["ID"];
  radius: Scalars["Float"];
}>;

export type UniversePlanetSetRadiusMutation = {
  __typename?: "Mutation";
  pluginUniversePlanetSetRadius: {__typename?: "Entity"; id: string};
};

export type UniversePlanetSetRingsMutationVariables = Exact<{
  id: Scalars["ID"];
  objectId: Scalars["ID"];
  image: Scalars["Upload"];
}>;

export type UniversePlanetSetRingsMutation = {
  __typename?: "Mutation";
  pluginUniversePlanetSetRings: {__typename?: "Entity"; id: string};
};

export type UniversePlanetSetTemperatureMutationVariables = Exact<{
  id: Scalars["ID"];
  objectId: Scalars["ID"];
  temperature: Scalars["Float"];
}>;

export type UniversePlanetSetTemperatureMutation = {
  __typename?: "Mutation";
  pluginUniversePlanetSetTemperature: {__typename?: "Entity"; id: string};
};

export type UniversePlanetSetTerranMassMutationVariables = Exact<{
  id: Scalars["ID"];
  objectId: Scalars["ID"];
  terranMass: Scalars["Float"];
}>;

export type UniversePlanetSetTerranMassMutation = {
  __typename?: "Mutation";
  pluginUniversePlanetSetTerranMass: {__typename?: "Entity"; id: string};
};

export type UniversePlanetSetTextureMutationVariables = Exact<{
  id: Scalars["ID"];
  objectId: Scalars["ID"];
  image: Scalars["Upload"];
}>;

export type UniversePlanetSetTextureMutation = {
  __typename?: "Mutation";
  pluginUniversePlanetSetTexture: {__typename?: "Entity"; id: string};
};

export type UniverseSatelliteSetAxialTiltMutationVariables = Exact<{
  id: Scalars["ID"];
  objectId: Scalars["ID"];
  axialTilt: Scalars["Float"];
}>;

export type UniverseSatelliteSetAxialTiltMutation = {
  __typename?: "Mutation";
  pluginUniverseSatelliteSetAxialTilt: {__typename?: "Entity"; id: string};
};

export type UniverseSatelliteSetDistanceMutationVariables = Exact<{
  id: Scalars["ID"];
  objectId: Scalars["ID"];
  distance: Scalars["Float"];
}>;

export type UniverseSatelliteSetDistanceMutation = {
  __typename?: "Mutation";
  pluginUniverseSatelliteSetDistance: {__typename?: "Entity"; id: string};
};

export type UniverseSatelliteSetEccentricityMutationVariables = Exact<{
  id: Scalars["ID"];
  objectId: Scalars["ID"];
  eccentricity: Scalars["Float"];
}>;

export type UniverseSatelliteSetEccentricityMutation = {
  __typename?: "Mutation";
  pluginUniverseSatelliteSetEccentricity: {__typename?: "Entity"; id: string};
};

export type UniverseSatelliteSetOrbitalArcMutationVariables = Exact<{
  id: Scalars["ID"];
  objectId: Scalars["ID"];
  orbitalArc: Scalars["Float"];
}>;

export type UniverseSatelliteSetOrbitalArcMutation = {
  __typename?: "Mutation";
  pluginUniverseSatelliteSetOrbitalArc: {__typename?: "Entity"; id: string};
};

export type UniverseSatelliteSetOrbitalInclinationMutationVariables = Exact<{
  id: Scalars["ID"];
  objectId: Scalars["ID"];
  orbitalInclination: Scalars["Float"];
}>;

export type UniverseSatelliteSetOrbitalInclinationMutation = {
  __typename?: "Mutation";
  pluginUniverseSatelliteSetOrbitalInclination: {
    __typename?: "Entity";
    id: string;
  };
};

export type UniverseSatelliteSetShowOrbitMutationVariables = Exact<{
  id: Scalars["ID"];
  objectId: Scalars["ID"];
  showOrbit: Scalars["Boolean"];
}>;

export type UniverseSatelliteSetShowOrbitMutation = {
  __typename?: "Mutation";
  pluginUniverseSatelliteSetShowOrbit: {__typename?: "Entity"; id: string};
};

export type UniverseSearchQueryVariables = Exact<{
  id: Scalars["ID"];
  search: Scalars["String"];
}>;

export type UniverseSearchQuery = {
  __typename?: "Query";
  pluginUniverseSearch: Array<{
    __typename?: "Entity";
    id: string;
    entityType: EntityTypes;
    identity: {
      __typename?: "IdentityComponent";
      name: string;
      description: string;
    };
    planetarySystem: Maybe<{
      __typename?: "PlanetarySystemComponent";
      skyboxKey: string;
    }>;
    satellite: Maybe<{
      __typename?: "SatelliteComponent";
      parent: Maybe<{
        __typename?: "Entity";
        id: string;
        entityType: EntityTypes;
        identity: {__typename?: "IdentityComponent"; name: string};
      }>;
    }>;
  }>;
};

export type UniverseStarbaseSetPositionMutationVariables = Exact<{
  pluginId: Scalars["ID"];
  shipId: Scalars["ID"];
  position: PositionInput;
}>;

export type UniverseStarbaseSetPositionMutation = {
  __typename?: "Mutation";
  pluginUniverseStarbaseSetPosition: {__typename?: "Entity"; id: string};
};

export type UniverseStarSetAgeMutationVariables = Exact<{
  id: Scalars["ID"];
  objectId: Scalars["ID"];
  age: Scalars["Float"];
}>;

export type UniverseStarSetAgeMutation = {
  __typename?: "Mutation";
  pluginUniverseStarSetAge: {__typename?: "Entity"; id: string};
};

export type UniverseStarSetHueMutationVariables = Exact<{
  id: Scalars["ID"];
  objectId: Scalars["ID"];
  hue: Scalars["Float"];
}>;

export type UniverseStarSetHueMutation = {
  __typename?: "Mutation";
  pluginUniverseStarSetHue: {__typename?: "Entity"; id: string};
};

export type UniverseStarSetIsWhiteMutationVariables = Exact<{
  id: Scalars["ID"];
  objectId: Scalars["ID"];
  isWhite: Scalars["Boolean"];
}>;

export type UniverseStarSetIsWhiteMutation = {
  __typename?: "Mutation";
  pluginUniverseStarSetIsWhite: {__typename?: "Entity"; id: string};
};

export type UniverseStarSetRadiusMutationVariables = Exact<{
  id: Scalars["ID"];
  objectId: Scalars["ID"];
  radius: Scalars["Float"];
}>;

export type UniverseStarSetRadiusMutation = {
  __typename?: "Mutation";
  pluginUniverseStarSetRadius: {__typename?: "Entity"; id: string};
};

export type UniverseStarSetSolarMassMutationVariables = Exact<{
  id: Scalars["ID"];
  objectId: Scalars["ID"];
  solarMass: Scalars["Float"];
}>;

export type UniverseStarSetSolarMassMutation = {
  __typename?: "Mutation";
  pluginUniverseStarSetSolarMass: {__typename?: "Entity"; id: string};
};

export type UniverseStarSetTemperatureMutationVariables = Exact<{
  id: Scalars["ID"];
  objectId: Scalars["ID"];
  temperature: Scalars["Float"];
}>;

export type UniverseStarSetTemperatureMutation = {
  __typename?: "Mutation";
  pluginUniverseStarSetTemperature: {__typename?: "Entity"; id: string};
};

export type UniverseSubscriptionVariables = Exact<{
  id: Scalars["ID"];
}>;

export type UniverseSubscription = {
  __typename?: "Subscription";
  pluginUniverse: Array<{
    __typename?: "Entity";
    id: string;
    entityType: EntityTypes;
    identity: {
      __typename?: "IdentityComponent";
      name: string;
      description: string;
    };
    tags: {__typename?: "TagsComponent"; tags: Array<string>};
    position: Maybe<{
      __typename?: "PositionComponent";
      x: number;
      y: number;
      z: number;
    }>;
    planetarySystem: Maybe<{
      __typename?: "PlanetarySystemComponent";
      skyboxKey: string;
    }>;
  }>;
};

export type UniverseAddStarbaseMutationVariables = Exact<{
  pluginId: Scalars["ID"];
  systemId: Scalars["ID"];
  shipId: Scalars["ID"];
  position: CoordinatesInput;
}>;

export type UniverseAddStarbaseMutation = {
  __typename?: "Mutation";
  pluginUniverseAddStarbase: {__typename?: "Entity"; id: string};
};

export type UniverseSystemSetDescriptionMutationVariables = Exact<{
  id: Scalars["ID"];
  systemId: Scalars["ID"];
  description: Scalars["String"];
}>;

export type UniverseSystemSetDescriptionMutation = {
  __typename?: "Mutation";
  pluginUniverseSystemSetDescription: {
    __typename?: "PlanetarySystem";
    id: string;
  };
};

export type UniverseSystemSetNameMutationVariables = Exact<{
  id: Scalars["ID"];
  systemId: Scalars["ID"];
  name: Scalars["String"];
}>;

export type UniverseSystemSetNameMutation = {
  __typename?: "Mutation";
  pluginUniverseSystemSetName: {__typename?: "PlanetarySystem"; id: string};
};

export type UniverseSystemSetPositionMutationVariables = Exact<{
  id: Scalars["ID"];
  systemId: Scalars["ID"];
  position: PositionInput;
}>;

export type UniverseSystemSetPositionMutation = {
  __typename?: "Mutation";
  pluginUniverseSystemSetPosition: {__typename?: "PlanetarySystem"; id: string};
};

export type UniverseSystemSetSkyboxMutationVariables = Exact<{
  id: Scalars["ID"];
  systemId: Scalars["ID"];
  skyboxKey: Scalars["String"];
}>;

export type UniverseSystemSetSkyboxMutation = {
  __typename?: "Mutation";
  pluginUniverseSystemSetSkyboxKey: {
    __typename?: "PlanetarySystem";
    id: string;
  };
};

export type TemplateSystemSubscriptionVariables = Exact<{
  id: Scalars["ID"];
  systemId: Scalars["ID"];
}>;

export type TemplateSystemSubscription = {
  __typename?: "Subscription";
  pluginUniverseSystem: {
    __typename?: "PlanetarySystem";
    id: string;
    habitableZoneInner: number;
    habitableZoneOuter: number;
    identity: {
      __typename?: "IdentityComponent";
      name: string;
      description: string;
    };
    planetarySystem: Maybe<{
      __typename?: "PlanetarySystemComponent";
      skyboxKey: string;
    }>;
    items: Array<
      {
        __typename?: "Entity";
        satellite: Maybe<
          {
            __typename?: "SatelliteComponent";
            satellites: Maybe<
              Array<{__typename?: "Entity"} & UniverseObjectFragment>
            >;
          } & SatelliteComponentFragment
        >;
      } & UniverseObjectFragment
    >;
  };
};

export type UniverseSystemShipsSubscriptionVariables = Exact<{
  systemId: Scalars["ID"];
}>;

export type UniverseSystemShipsSubscription = {
  __typename?: "Subscription";
  universeSystemShips: Array<{
    __typename?: "Entity";
    id: string;
    identity: {__typename?: "IdentityComponent"; name: string};
    position: Maybe<{
      __typename?: "PositionComponent";
      x: number;
      y: number;
      z: number;
    }>;
    rotation: Maybe<{
      __typename?: "RotationComponent";
      x: number;
      y: number;
      z: number;
      w: number;
    }>;
    autopilot: {
      __typename?: "AutopilotComponent";
      desiredCoordinates: Maybe<{
        __typename?: "Coordinates";
        x: number;
        y: number;
        z: number;
      }>;
    };
    size: Maybe<{__typename?: "SizeComponent"; value: number}>;
    shipAssets: Maybe<{__typename?: "ShipAssetsComponent"; model: string}>;
  }>;
};

export type UniverseSystemShipsHotSubscriptionVariables = Exact<{
  systemId: Scalars["ID"];
  autopilotIncluded?: Maybe<Scalars["Boolean"]>;
}>;

export type UniverseSystemShipsHotSubscription = {
  __typename?: "Subscription";
  universeSystemShipsHot: Array<{
    __typename?: "Entity";
    id: string;
    position: Maybe<{
      __typename?: "PositionComponent";
      x: number;
      y: number;
      z: number;
    }>;
    rotation: Maybe<{
      __typename?: "RotationComponent";
      x: number;
      y: number;
      z: number;
      w: number;
    }>;
    autopilot: {
      __typename?: "AutopilotComponent";
      desiredCoordinates: Maybe<{
        __typename?: "Coordinates";
        x: number;
        y: number;
        z: number;
      }>;
    };
  }>;
};

export type UniverseSystemSubscriptionVariables = Exact<{
  systemId: Scalars["ID"];
}>;

export type UniverseSystemSubscription = {
  __typename?: "Subscription";
  universeSystem: {
    __typename?: "ActivePlanetarySystem";
    id: string;
    habitableZoneInner: number;
    habitableZoneOuter: number;
    identity: {
      __typename?: "IdentityComponent";
      name: string;
      description: string;
    };
    planetarySystem: Maybe<{
      __typename?: "PlanetarySystemComponent";
      skyboxKey: string;
    }>;
    items: Array<
      {
        __typename?: "Entity";
        satellite: Maybe<
          {
            __typename?: "SatelliteComponent";
            satellites: Maybe<
              Array<{__typename?: "Entity"} & UniverseObjectFragment>
            >;
          } & SatelliteComponentFragment
        >;
      } & UniverseObjectFragment
    >;
  };
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

export type FlightStartMutationVariables = Exact<{
  name: Maybe<Scalars["String"]>;
  plugins: Array<Scalars["ID"]>;
  simulators: Array<FlightStartSimulator>;
}>;

export type FlightStartMutation = {
  __typename?: "Mutation";
  flightStart: {
    __typename?: "Flight";
    id: string;
    name: string;
    paused: boolean;
    date: Date;
  };
};

export type ActiveFlightQueryVariables = Exact<{[key: string]: never}>;

export type ActiveFlightQuery = {
  __typename?: "Query";
  flight: Maybe<{__typename?: "Flight"; id: string}>;
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

export const SatelliteComponentFragmentDoc = gql`
  fragment SatelliteComponent on SatelliteComponent {
    distance
    axialTilt
    showOrbit
    orbitalArc
    eccentricity
    orbitalInclination
  }
`;
export const UniverseObjectFragmentDoc = gql`
  fragment UniverseObject on Entity {
    id
    identity {
      name
      description
    }
    tags {
      tags
    }
    isStar {
      age
      hue
      isWhite
      solarMass
      spectralType
      radius
    }
    isPlanet {
      age
      classification
      radius
      terranMass
      habitable
      lifeforms
      textureMapAsset
      cloudsMapAsset
      ringsMapAsset
    }
    isShip {
      category
    }
    size {
      value
    }
    shipAssets {
      model
    }
    satellite {
      ...SatelliteComponent
    }
    position {
      x
      y
      z
    }
    rotation {
      x
      y
      z
      w
    }
    temperature {
      temperature
    }
    population {
      count
    }
  }
  ${SatelliteComponentFragmentDoc}
`;
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
export const AvailableShipsDocument = gql`
  query AvailableShips {
    flight {
      id
      availableShips {
        id
        isShip {
          category
        }
        identity {
          name
        }
        shipAssets {
          vanity
        }
        factionAssignment {
          faction {
            id
            identity {
              name
            }
            isFaction {
              color
            }
          }
        }
      }
    }
  }
`;
export function useAvailableShipsQuery(
  baseOptions?: Apollo.QueryHookOptions<
    AvailableShipsQuery,
    AvailableShipsQueryVariables
  >
) {
  return Apollo.useQuery<AvailableShipsQuery, AvailableShipsQueryVariables>(
    AvailableShipsDocument,
    baseOptions
  );
}
export function useAvailableShipsLazyQuery(
  baseOptions?: Apollo.LazyQueryHookOptions<
    AvailableShipsQuery,
    AvailableShipsQueryVariables
  >
) {
  return Apollo.useLazyQuery<AvailableShipsQuery, AvailableShipsQueryVariables>(
    AvailableShipsDocument,
    baseOptions
  );
}
export type AvailableShipsQueryHookResult = ReturnType<
  typeof useAvailableShipsQuery
>;
export type AvailableShipsLazyQueryHookResult = ReturnType<
  typeof useAvailableShipsLazyQuery
>;
export const ShipSpawnDocument = gql`
  mutation ShipSpawn(
    $systemId: ID!
    $templateId: ID!
    $position: CoordinatesInput!
  ) {
    shipSpawn(
      systemId: $systemId
      templateId: $templateId
      position: $position
    ) {
      id
    }
  }
`;
export function useShipSpawnMutation(
  baseOptions?: Apollo.MutationHookOptions<
    ShipSpawnMutation,
    ShipSpawnMutationVariables
  >
) {
  return Apollo.useMutation<ShipSpawnMutation, ShipSpawnMutationVariables>(
    ShipSpawnDocument,
    baseOptions
  );
}
export type ShipSpawnMutationHookResult = ReturnType<
  typeof useShipSpawnMutation
>;
export const UniverseObjectsDocument = gql`
  query UniverseObjects($pluginIds: [ID!]!) {
    pluginUniverseGetPersistentObjects(pluginIds: $pluginIds) {
      id
      identity {
        name
      }
      entityType
      satellite {
        parent {
          id
          identity {
            name
          }
        }
      }
      interstellarPosition {
        system {
          id
          identity {
            name
          }
        }
      }
    }
  }
`;
export function useUniverseObjectsQuery(
  baseOptions: Apollo.QueryHookOptions<
    UniverseObjectsQuery,
    UniverseObjectsQueryVariables
  >
) {
  return Apollo.useQuery<UniverseObjectsQuery, UniverseObjectsQueryVariables>(
    UniverseObjectsDocument,
    baseOptions
  );
}
export function useUniverseObjectsLazyQuery(
  baseOptions?: Apollo.LazyQueryHookOptions<
    UniverseObjectsQuery,
    UniverseObjectsQueryVariables
  >
) {
  return Apollo.useLazyQuery<
    UniverseObjectsQuery,
    UniverseObjectsQueryVariables
  >(UniverseObjectsDocument, baseOptions);
}
export type UniverseObjectsQueryHookResult = ReturnType<
  typeof useUniverseObjectsQuery
>;
export type UniverseObjectsLazyQueryHookResult = ReturnType<
  typeof useUniverseObjectsLazyQuery
>;
export const AllPluginShipsDocument = gql`
  query AllPluginShips($pluginIds: [ID!]!) {
    allPluginShips(pluginIds: $pluginIds) {
      id
      plugin {
        id
        name
      }
      identity {
        name
        description
      }
      shipAssets {
        vanity
      }
    }
  }
`;
export function useAllPluginShipsQuery(
  baseOptions: Apollo.QueryHookOptions<
    AllPluginShipsQuery,
    AllPluginShipsQueryVariables
  >
) {
  return Apollo.useQuery<AllPluginShipsQuery, AllPluginShipsQueryVariables>(
    AllPluginShipsDocument,
    baseOptions
  );
}
export function useAllPluginShipsLazyQuery(
  baseOptions?: Apollo.LazyQueryHookOptions<
    AllPluginShipsQuery,
    AllPluginShipsQueryVariables
  >
) {
  return Apollo.useLazyQuery<AllPluginShipsQuery, AllPluginShipsQueryVariables>(
    AllPluginShipsDocument,
    baseOptions
  );
}
export type AllPluginShipsQueryHookResult = ReturnType<
  typeof useAllPluginShipsQuery
>;
export type AllPluginShipsLazyQueryHookResult = ReturnType<
  typeof useAllPluginShipsLazyQuery
>;
export const FlightStopDocument = gql`
  mutation FlightStop {
    flightStop
  }
`;
export function useFlightStopMutation(
  baseOptions?: Apollo.MutationHookOptions<
    FlightStopMutation,
    FlightStopMutationVariables
  >
) {
  return Apollo.useMutation<FlightStopMutation, FlightStopMutationVariables>(
    FlightStopDocument,
    baseOptions
  );
}
export type FlightStopMutationHookResult = ReturnType<
  typeof useFlightStopMutation
>;
export const FlightPauseDocument = gql`
  mutation FlightPause {
    flightPause {
      id
    }
  }
`;
export function useFlightPauseMutation(
  baseOptions?: Apollo.MutationHookOptions<
    FlightPauseMutation,
    FlightPauseMutationVariables
  >
) {
  return Apollo.useMutation<FlightPauseMutation, FlightPauseMutationVariables>(
    FlightPauseDocument,
    baseOptions
  );
}
export type FlightPauseMutationHookResult = ReturnType<
  typeof useFlightPauseMutation
>;
export const FlightResetDocument = gql`
  mutation FlightReset {
    flightReset {
      id
    }
  }
`;
export function useFlightResetMutation(
  baseOptions?: Apollo.MutationHookOptions<
    FlightResetMutation,
    FlightResetMutationVariables
  >
) {
  return Apollo.useMutation<FlightResetMutation, FlightResetMutationVariables>(
    FlightResetDocument,
    baseOptions
  );
}
export type FlightResetMutationHookResult = ReturnType<
  typeof useFlightResetMutation
>;
export const FlightResumeDocument = gql`
  mutation FlightResume {
    flightResume {
      id
    }
  }
`;
export function useFlightResumeMutation(
  baseOptions?: Apollo.MutationHookOptions<
    FlightResumeMutation,
    FlightResumeMutationVariables
  >
) {
  return Apollo.useMutation<
    FlightResumeMutation,
    FlightResumeMutationVariables
  >(FlightResumeDocument, baseOptions);
}
export type FlightResumeMutationHookResult = ReturnType<
  typeof useFlightResumeMutation
>;
export const FlightDocument = gql`
  subscription Flight {
    flight {
      id
      name
      paused
      date
      playerShips {
        id
        identity {
          name
        }
        shipAssets {
          logo
          vanity
        }
      }
    }
  }
`;
export function useFlightSubscription(
  baseOptions?: Apollo.SubscriptionHookOptions<
    FlightSubscription,
    FlightSubscriptionVariables
  >
) {
  return Apollo.useSubscription<
    FlightSubscription,
    FlightSubscriptionVariables
  >(FlightDocument, baseOptions);
}
export type FlightSubscriptionHookResult = ReturnType<
  typeof useFlightSubscription
>;
export const OutfitAbilitiesDocument = gql`
  query OutfitAbilities {
    outfitAbilities: __type(name: "OutfitAbilities") {
      enumValues {
        name
      }
    }
  }
`;
export function useOutfitAbilitiesQuery(
  baseOptions?: Apollo.QueryHookOptions<
    OutfitAbilitiesQuery,
    OutfitAbilitiesQueryVariables
  >
) {
  return Apollo.useQuery<OutfitAbilitiesQuery, OutfitAbilitiesQueryVariables>(
    OutfitAbilitiesDocument,
    baseOptions
  );
}
export function useOutfitAbilitiesLazyQuery(
  baseOptions?: Apollo.LazyQueryHookOptions<
    OutfitAbilitiesQuery,
    OutfitAbilitiesQueryVariables
  >
) {
  return Apollo.useLazyQuery<
    OutfitAbilitiesQuery,
    OutfitAbilitiesQueryVariables
  >(OutfitAbilitiesDocument, baseOptions);
}
export type OutfitAbilitiesQueryHookResult = ReturnType<
  typeof useOutfitAbilitiesQuery
>;
export type OutfitAbilitiesLazyQueryHookResult = ReturnType<
  typeof useOutfitAbilitiesLazyQuery
>;
export const PluginAddOutfitDocument = gql`
  mutation PluginAddOutfit($pluginId: ID!, $ability: OutfitAbilities!) {
    pluginAddOutfit(pluginId: $pluginId, ability: $ability) {
      id
      identity {
        name
        description
      }
    }
  }
`;
export function usePluginAddOutfitMutation(
  baseOptions?: Apollo.MutationHookOptions<
    PluginAddOutfitMutation,
    PluginAddOutfitMutationVariables
  >
) {
  return Apollo.useMutation<
    PluginAddOutfitMutation,
    PluginAddOutfitMutationVariables
  >(PluginAddOutfitDocument, baseOptions);
}
export type PluginAddOutfitMutationHookResult = ReturnType<
  typeof usePluginAddOutfitMutation
>;
export const PluginOutfitRemoveDocument = gql`
  mutation PluginOutfitRemove($pluginId: ID!, $outfitId: ID!) {
    pluginOutfitRemove(pluginId: $pluginId, outfitId: $outfitId)
  }
`;
export function usePluginOutfitRemoveMutation(
  baseOptions?: Apollo.MutationHookOptions<
    PluginOutfitRemoveMutation,
    PluginOutfitRemoveMutationVariables
  >
) {
  return Apollo.useMutation<
    PluginOutfitRemoveMutation,
    PluginOutfitRemoveMutationVariables
  >(PluginOutfitRemoveDocument, baseOptions);
}
export type PluginOutfitRemoveMutationHookResult = ReturnType<
  typeof usePluginOutfitRemoveMutation
>;
export const PluginOutfitSetDescriptionDocument = gql`
  mutation PluginOutfitSetDescription(
    $pluginId: ID!
    $outfitId: ID!
    $description: String!
  ) {
    pluginOutfitSetDescription(
      pluginId: $pluginId
      outfitId: $outfitId
      description: $description
    ) {
      id
      identity {
        description
      }
    }
  }
`;
export function usePluginOutfitSetDescriptionMutation(
  baseOptions?: Apollo.MutationHookOptions<
    PluginOutfitSetDescriptionMutation,
    PluginOutfitSetDescriptionMutationVariables
  >
) {
  return Apollo.useMutation<
    PluginOutfitSetDescriptionMutation,
    PluginOutfitSetDescriptionMutationVariables
  >(PluginOutfitSetDescriptionDocument, baseOptions);
}
export type PluginOutfitSetDescriptionMutationHookResult = ReturnType<
  typeof usePluginOutfitSetDescriptionMutation
>;
export const PluginOutfitSetNameDocument = gql`
  mutation PluginOutfitSetName($pluginId: ID!, $outfitId: ID!, $name: String!) {
    pluginOutfitSetName(pluginId: $pluginId, outfitId: $outfitId, name: $name) {
      id
      identity {
        name
      }
    }
  }
`;
export function usePluginOutfitSetNameMutation(
  baseOptions?: Apollo.MutationHookOptions<
    PluginOutfitSetNameMutation,
    PluginOutfitSetNameMutationVariables
  >
) {
  return Apollo.useMutation<
    PluginOutfitSetNameMutation,
    PluginOutfitSetNameMutationVariables
  >(PluginOutfitSetNameDocument, baseOptions);
}
export type PluginOutfitSetNameMutationHookResult = ReturnType<
  typeof usePluginOutfitSetNameMutation
>;
export const PluginOutfitSetTagsDocument = gql`
  mutation PluginOutfitSetTags(
    $pluginId: ID!
    $outfitId: ID!
    $tags: [String!]!
  ) {
    pluginOutfitSetTags(pluginId: $pluginId, outfitId: $outfitId, tags: $tags) {
      id
      tags {
        tags
      }
    }
  }
`;
export function usePluginOutfitSetTagsMutation(
  baseOptions?: Apollo.MutationHookOptions<
    PluginOutfitSetTagsMutation,
    PluginOutfitSetTagsMutationVariables
  >
) {
  return Apollo.useMutation<
    PluginOutfitSetTagsMutation,
    PluginOutfitSetTagsMutationVariables
  >(PluginOutfitSetTagsDocument, baseOptions);
}
export type PluginOutfitSetTagsMutationHookResult = ReturnType<
  typeof usePluginOutfitSetTagsMutation
>;
export const PluginOutfitDocument = gql`
  subscription PluginOutfit($pluginId: ID!, $outfitId: ID!) {
    pluginOutfit(pluginId: $pluginId, id: $outfitId) {
      id
      identity {
        name
        description
      }
      isOutfit {
        outfitType
      }
      tags {
        tags
      }
      power {
        value
      }
      damage {
        value
      }
      efficiency {
        value
      }
      heat {
        value
      }
      trainingMode {
        value
      }
    }
  }
`;
export function usePluginOutfitSubscription(
  baseOptions: Apollo.SubscriptionHookOptions<
    PluginOutfitSubscription,
    PluginOutfitSubscriptionVariables
  >
) {
  return Apollo.useSubscription<
    PluginOutfitSubscription,
    PluginOutfitSubscriptionVariables
  >(PluginOutfitDocument, baseOptions);
}
export type PluginOutfitSubscriptionHookResult = ReturnType<
  typeof usePluginOutfitSubscription
>;
export const PluginOutfitsDocument = gql`
  subscription PluginOutfits($pluginId: ID!) {
    pluginOutfits(pluginId: $pluginId) {
      id
      identity {
        name
      }
      isOutfit {
        outfitType
      }
    }
  }
`;
export function usePluginOutfitsSubscription(
  baseOptions: Apollo.SubscriptionHookOptions<
    PluginOutfitsSubscription,
    PluginOutfitsSubscriptionVariables
  >
) {
  return Apollo.useSubscription<
    PluginOutfitsSubscription,
    PluginOutfitsSubscriptionVariables
  >(PluginOutfitsDocument, baseOptions);
}
export type PluginOutfitsSubscriptionHookResult = ReturnType<
  typeof usePluginOutfitsSubscription
>;
export const ImpulseEnginesSetCruisingSpeedDocument = gql`
  mutation ImpulseEnginesSetCruisingSpeed(
    $pluginId: ID
    $outfitId: ID
    $shipId: ID
    $speed: Float!
  ) {
    impulseEnginesSetCruisingSpeed(
      pluginId: $pluginId
      outfitId: $outfitId
      shipId: $shipId
      speed: $speed
    ) {
      id
    }
  }
`;
export function useImpulseEnginesSetCruisingSpeedMutation(
  baseOptions?: Apollo.MutationHookOptions<
    ImpulseEnginesSetCruisingSpeedMutation,
    ImpulseEnginesSetCruisingSpeedMutationVariables
  >
) {
  return Apollo.useMutation<
    ImpulseEnginesSetCruisingSpeedMutation,
    ImpulseEnginesSetCruisingSpeedMutationVariables
  >(ImpulseEnginesSetCruisingSpeedDocument, baseOptions);
}
export type ImpulseEnginesSetCruisingSpeedMutationHookResult = ReturnType<
  typeof useImpulseEnginesSetCruisingSpeedMutation
>;
export const ImpulseEnginesSetEmergencySpeedDocument = gql`
  mutation ImpulseEnginesSetEmergencySpeed(
    $pluginId: ID
    $outfitId: ID
    $shipId: ID
    $speed: Float!
  ) {
    impulseEnginesSetEmergencySpeed(
      pluginId: $pluginId
      outfitId: $outfitId
      shipId: $shipId
      speed: $speed
    ) {
      id
    }
  }
`;
export function useImpulseEnginesSetEmergencySpeedMutation(
  baseOptions?: Apollo.MutationHookOptions<
    ImpulseEnginesSetEmergencySpeedMutation,
    ImpulseEnginesSetEmergencySpeedMutationVariables
  >
) {
  return Apollo.useMutation<
    ImpulseEnginesSetEmergencySpeedMutation,
    ImpulseEnginesSetEmergencySpeedMutationVariables
  >(ImpulseEnginesSetEmergencySpeedDocument, baseOptions);
}
export type ImpulseEnginesSetEmergencySpeedMutationHookResult = ReturnType<
  typeof useImpulseEnginesSetEmergencySpeedMutation
>;
export const ImpulseEnginesSetThrustDocument = gql`
  mutation ImpulseEnginesSetThrust(
    $pluginId: ID
    $outfitId: ID
    $shipId: ID
    $thrust: Float!
  ) {
    impulseEnginesSetThrust(
      pluginId: $pluginId
      outfitId: $outfitId
      shipId: $shipId
      thrust: $thrust
    ) {
      id
    }
  }
`;
export function useImpulseEnginesSetThrustMutation(
  baseOptions?: Apollo.MutationHookOptions<
    ImpulseEnginesSetThrustMutation,
    ImpulseEnginesSetThrustMutationVariables
  >
) {
  return Apollo.useMutation<
    ImpulseEnginesSetThrustMutation,
    ImpulseEnginesSetThrustMutationVariables
  >(ImpulseEnginesSetThrustDocument, baseOptions);
}
export type ImpulseEnginesSetThrustMutationHookResult = ReturnType<
  typeof useImpulseEnginesSetThrustMutation
>;
export const ImpulseEnginesDocument = gql`
  subscription ImpulseEngines($pluginId: ID, $outfitId: ID, $shipId: ID) {
    impulseEnginesOutfit(
      pluginId: $pluginId
      outfitId: $outfitId
      shipId: $shipId
    ) {
      id
      impulseEngines {
        cruisingSpeed
        emergencySpeed
        thrust
        targetSpeed
      }
    }
  }
`;
export function useImpulseEnginesSubscription(
  baseOptions?: Apollo.SubscriptionHookOptions<
    ImpulseEnginesSubscription,
    ImpulseEnginesSubscriptionVariables
  >
) {
  return Apollo.useSubscription<
    ImpulseEnginesSubscription,
    ImpulseEnginesSubscriptionVariables
  >(ImpulseEnginesDocument, baseOptions);
}
export type ImpulseEnginesSubscriptionHookResult = ReturnType<
  typeof useImpulseEnginesSubscription
>;
export const NavigationSetDestinationRadiusDocument = gql`
  mutation NavigationSetDestinationRadius(
    $pluginId: ID
    $outfitId: ID
    $shipId: ID
    $radius: Float!
  ) {
    navigationSetMaxDestinationRadius(
      pluginId: $pluginId
      outfitId: $outfitId
      shipId: $shipId
      maxDestinationRadius: $radius
    ) {
      id
    }
  }
`;
export function useNavigationSetDestinationRadiusMutation(
  baseOptions?: Apollo.MutationHookOptions<
    NavigationSetDestinationRadiusMutation,
    NavigationSetDestinationRadiusMutationVariables
  >
) {
  return Apollo.useMutation<
    NavigationSetDestinationRadiusMutation,
    NavigationSetDestinationRadiusMutationVariables
  >(NavigationSetDestinationRadiusDocument, baseOptions);
}
export type NavigationSetDestinationRadiusMutationHookResult = ReturnType<
  typeof useNavigationSetDestinationRadiusMutation
>;
export const NavigationOutfitDocument = gql`
  subscription NavigationOutfit($pluginId: ID, $outfitId: ID, $shipId: ID) {
    navigationOutfit(
      pluginId: $pluginId
      outfitId: $outfitId
      shipId: $shipId
    ) {
      id
      navigation {
        maxDestinationRadius
      }
    }
  }
`;
export function useNavigationOutfitSubscription(
  baseOptions?: Apollo.SubscriptionHookOptions<
    NavigationOutfitSubscription,
    NavigationOutfitSubscriptionVariables
  >
) {
  return Apollo.useSubscription<
    NavigationOutfitSubscription,
    NavigationOutfitSubscriptionVariables
  >(NavigationOutfitDocument, baseOptions);
}
export type NavigationOutfitSubscriptionHookResult = ReturnType<
  typeof useNavigationOutfitSubscription
>;
export const ThrustersSetDirectionMaxSpeedDocument = gql`
  mutation ThrustersSetDirectionMaxSpeed(
    $pluginId: ID
    $outfitId: ID
    $shipId: ID
    $speed: Float!
  ) {
    thrustersSetDirectionMaxSpeed(
      pluginId: $pluginId
      outfitId: $outfitId
      shipId: $shipId
      speed: $speed
    ) {
      id
    }
  }
`;
export function useThrustersSetDirectionMaxSpeedMutation(
  baseOptions?: Apollo.MutationHookOptions<
    ThrustersSetDirectionMaxSpeedMutation,
    ThrustersSetDirectionMaxSpeedMutationVariables
  >
) {
  return Apollo.useMutation<
    ThrustersSetDirectionMaxSpeedMutation,
    ThrustersSetDirectionMaxSpeedMutationVariables
  >(ThrustersSetDirectionMaxSpeedDocument, baseOptions);
}
export type ThrustersSetDirectionMaxSpeedMutationHookResult = ReturnType<
  typeof useThrustersSetDirectionMaxSpeedMutation
>;
export const ThrustersSetDirectionThrustDocument = gql`
  mutation ThrustersSetDirectionThrust(
    $pluginId: ID
    $outfitId: ID
    $shipId: ID
    $thrust: Float!
  ) {
    thrustersSetDirectionThrust(
      pluginId: $pluginId
      outfitId: $outfitId
      shipId: $shipId
      thrust: $thrust
    ) {
      id
    }
  }
`;
export function useThrustersSetDirectionThrustMutation(
  baseOptions?: Apollo.MutationHookOptions<
    ThrustersSetDirectionThrustMutation,
    ThrustersSetDirectionThrustMutationVariables
  >
) {
  return Apollo.useMutation<
    ThrustersSetDirectionThrustMutation,
    ThrustersSetDirectionThrustMutationVariables
  >(ThrustersSetDirectionThrustDocument, baseOptions);
}
export type ThrustersSetDirectionThrustMutationHookResult = ReturnType<
  typeof useThrustersSetDirectionThrustMutation
>;
export const ThrustersSetRotationMaxSpeedDocument = gql`
  mutation ThrustersSetRotationMaxSpeed(
    $pluginId: ID
    $outfitId: ID
    $shipId: ID
    $speed: Float!
  ) {
    thrustersSetRotationMaxSpeed(
      pluginId: $pluginId
      outfitId: $outfitId
      shipId: $shipId
      speed: $speed
    ) {
      id
    }
  }
`;
export function useThrustersSetRotationMaxSpeedMutation(
  baseOptions?: Apollo.MutationHookOptions<
    ThrustersSetRotationMaxSpeedMutation,
    ThrustersSetRotationMaxSpeedMutationVariables
  >
) {
  return Apollo.useMutation<
    ThrustersSetRotationMaxSpeedMutation,
    ThrustersSetRotationMaxSpeedMutationVariables
  >(ThrustersSetRotationMaxSpeedDocument, baseOptions);
}
export type ThrustersSetRotationMaxSpeedMutationHookResult = ReturnType<
  typeof useThrustersSetRotationMaxSpeedMutation
>;
export const ThrustersSetRotationThrustDocument = gql`
  mutation ThrustersSetRotationThrust(
    $pluginId: ID
    $outfitId: ID
    $shipId: ID
    $thrust: Float!
  ) {
    thrustersSetRotationThrust(
      pluginId: $pluginId
      outfitId: $outfitId
      shipId: $shipId
      thrust: $thrust
    ) {
      id
    }
  }
`;
export function useThrustersSetRotationThrustMutation(
  baseOptions?: Apollo.MutationHookOptions<
    ThrustersSetRotationThrustMutation,
    ThrustersSetRotationThrustMutationVariables
  >
) {
  return Apollo.useMutation<
    ThrustersSetRotationThrustMutation,
    ThrustersSetRotationThrustMutationVariables
  >(ThrustersSetRotationThrustDocument, baseOptions);
}
export type ThrustersSetRotationThrustMutationHookResult = ReturnType<
  typeof useThrustersSetRotationThrustMutation
>;
export const ThrustersDocument = gql`
  subscription Thrusters($pluginId: ID, $outfitId: ID, $shipId: ID) {
    thrustersOutfit(pluginId: $pluginId, outfitId: $outfitId, shipId: $shipId) {
      id
      thrusters {
        directionMaxSpeed
        directionThrust
        rotationMaxSpeed
        rotationThrust
      }
    }
  }
`;
export function useThrustersSubscription(
  baseOptions?: Apollo.SubscriptionHookOptions<
    ThrustersSubscription,
    ThrustersSubscriptionVariables
  >
) {
  return Apollo.useSubscription<
    ThrustersSubscription,
    ThrustersSubscriptionVariables
  >(ThrustersDocument, baseOptions);
}
export type ThrustersSubscriptionHookResult = ReturnType<
  typeof useThrustersSubscription
>;
export const WarpEnginesSetWarpFactorCountDocument = gql`
  mutation WarpEnginesSetWarpFactorCount(
    $pluginId: ID
    $outfitId: ID
    $shipId: ID
    $count: Int!
  ) {
    warpEngineSetWarpFactorCount(
      pluginId: $pluginId
      outfitId: $outfitId
      shipId: $shipId
      count: $count
    ) {
      id
    }
  }
`;
export function useWarpEnginesSetWarpFactorCountMutation(
  baseOptions?: Apollo.MutationHookOptions<
    WarpEnginesSetWarpFactorCountMutation,
    WarpEnginesSetWarpFactorCountMutationVariables
  >
) {
  return Apollo.useMutation<
    WarpEnginesSetWarpFactorCountMutation,
    WarpEnginesSetWarpFactorCountMutationVariables
  >(WarpEnginesSetWarpFactorCountDocument, baseOptions);
}
export type WarpEnginesSetWarpFactorCountMutationHookResult = ReturnType<
  typeof useWarpEnginesSetWarpFactorCountMutation
>;
export const WarpEnginesDocument = gql`
  subscription WarpEngines($pluginId: ID, $outfitId: ID, $shipId: ID) {
    warpEnginesOutfit(
      pluginId: $pluginId
      outfitId: $outfitId
      shipId: $shipId
    ) {
      id
      warpEngines {
        warpFactorCount
        currentWarpFactor
        minSpeedMultiplier
        planetaryCruisingSpeed
        interstellarCruisingSpeed
      }
    }
  }
`;
export function useWarpEnginesSubscription(
  baseOptions?: Apollo.SubscriptionHookOptions<
    WarpEnginesSubscription,
    WarpEnginesSubscriptionVariables
  >
) {
  return Apollo.useSubscription<
    WarpEnginesSubscription,
    WarpEnginesSubscriptionVariables
  >(WarpEnginesDocument, baseOptions);
}
export type WarpEnginesSubscriptionHookResult = ReturnType<
  typeof useWarpEnginesSubscription
>;
export const PhraseCreateDocument = gql`
  mutation PhraseCreate($pluginId: ID!, $name: String!) {
    phraseCreate(pluginId: $pluginId, name: $name) {
      id
      name
    }
  }
`;
export function usePhraseCreateMutation(
  baseOptions?: Apollo.MutationHookOptions<
    PhraseCreateMutation,
    PhraseCreateMutationVariables
  >
) {
  return Apollo.useMutation<
    PhraseCreateMutation,
    PhraseCreateMutationVariables
  >(PhraseCreateDocument, baseOptions);
}
export type PhraseCreateMutationHookResult = ReturnType<
  typeof usePhraseCreateMutation
>;
export const PhraseListsDocument = gql`
  subscription PhraseLists($pluginId: ID!) {
    phrases(pluginId: $pluginId) {
      id
      name
      category
      units {
        id
        type
        contents
      }
    }
  }
`;
export function usePhraseListsSubscription(
  baseOptions: Apollo.SubscriptionHookOptions<
    PhraseListsSubscription,
    PhraseListsSubscriptionVariables
  >
) {
  return Apollo.useSubscription<
    PhraseListsSubscription,
    PhraseListsSubscriptionVariables
  >(PhraseListsDocument, baseOptions);
}
export type PhraseListsSubscriptionHookResult = ReturnType<
  typeof usePhraseListsSubscription
>;
export const PhraseParseDocument = gql`
  query PhraseParse($phraseId: ID!) {
    phraseParse(phraseId: $phraseId)
  }
`;
export function usePhraseParseQuery(
  baseOptions: Apollo.QueryHookOptions<
    PhraseParseQuery,
    PhraseParseQueryVariables
  >
) {
  return Apollo.useQuery<PhraseParseQuery, PhraseParseQueryVariables>(
    PhraseParseDocument,
    baseOptions
  );
}
export function usePhraseParseLazyQuery(
  baseOptions?: Apollo.LazyQueryHookOptions<
    PhraseParseQuery,
    PhraseParseQueryVariables
  >
) {
  return Apollo.useLazyQuery<PhraseParseQuery, PhraseParseQueryVariables>(
    PhraseParseDocument,
    baseOptions
  );
}
export type PhraseParseQueryHookResult = ReturnType<typeof usePhraseParseQuery>;
export type PhraseParseLazyQueryHookResult = ReturnType<
  typeof usePhraseParseLazyQuery
>;
export const PhraseRemoveDocument = gql`
  mutation PhraseRemove($pluginId: ID!, $id: ID!) {
    phraseRemove(pluginId: $pluginId, id: $id)
  }
`;
export function usePhraseRemoveMutation(
  baseOptions?: Apollo.MutationHookOptions<
    PhraseRemoveMutation,
    PhraseRemoveMutationVariables
  >
) {
  return Apollo.useMutation<
    PhraseRemoveMutation,
    PhraseRemoveMutationVariables
  >(PhraseRemoveDocument, baseOptions);
}
export type PhraseRemoveMutationHookResult = ReturnType<
  typeof usePhraseRemoveMutation
>;
export const PhraseCategoryDocument = gql`
  mutation PhraseCategory($pluginId: ID!, $phraseId: ID!, $category: String!) {
    phraseSetCategory(
      pluginId: $pluginId
      phraseId: $phraseId
      category: $category
    ) {
      id
      category
    }
  }
`;
export function usePhraseCategoryMutation(
  baseOptions?: Apollo.MutationHookOptions<
    PhraseCategoryMutation,
    PhraseCategoryMutationVariables
  >
) {
  return Apollo.useMutation<
    PhraseCategoryMutation,
    PhraseCategoryMutationVariables
  >(PhraseCategoryDocument, baseOptions);
}
export type PhraseCategoryMutationHookResult = ReturnType<
  typeof usePhraseCategoryMutation
>;
export const PhraseSetUnitsDocument = gql`
  mutation PhraseSetUnits(
    $pluginId: ID!
    $phraseId: ID!
    $units: [PhraseUnitInput!]!
  ) {
    phraseSetContents(pluginId: $pluginId, phraseId: $phraseId, units: $units) {
      id
    }
  }
`;
export function usePhraseSetUnitsMutation(
  baseOptions?: Apollo.MutationHookOptions<
    PhraseSetUnitsMutation,
    PhraseSetUnitsMutationVariables
  >
) {
  return Apollo.useMutation<
    PhraseSetUnitsMutation,
    PhraseSetUnitsMutationVariables
  >(PhraseSetUnitsDocument, baseOptions);
}
export type PhraseSetUnitsMutationHookResult = ReturnType<
  typeof usePhraseSetUnitsMutation
>;
export const PhraseSetNameDocument = gql`
  mutation PhraseSetName($pluginId: ID!, $phraseId: ID!, $name: String!) {
    phraseSetName(pluginId: $pluginId, phraseId: $phraseId, name: $name) {
      id
      name
    }
  }
`;
export function usePhraseSetNameMutation(
  baseOptions?: Apollo.MutationHookOptions<
    PhraseSetNameMutation,
    PhraseSetNameMutationVariables
  >
) {
  return Apollo.useMutation<
    PhraseSetNameMutation,
    PhraseSetNameMutationVariables
  >(PhraseSetNameDocument, baseOptions);
}
export type PhraseSetNameMutationHookResult = ReturnType<
  typeof usePhraseSetNameMutation
>;
export const TemplateShipAssetsDocument = gql`
  subscription TemplateShipAssets($pluginId: ID!, $id: ID!) {
    pluginShip(pluginId: $pluginId, id: $id) {
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
  baseOptions: Apollo.SubscriptionHookOptions<
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
  mutation TemplateShipSetLogo($id: ID!, $pluginId: ID!, $image: Upload!) {
    pluginShipSetLogo(id: $id, pluginId: $pluginId, image: $image) {
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
    $pluginId: ID!
    $model: Upload!
    $side: Upload!
    $top: Upload!
    $vanity: Upload!
  ) {
    pluginShipSetModel(
      id: $id
      pluginId: $pluginId
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
export const PluginShipAddOutfitDocument = gql`
  mutation PluginShipAddOutfit($pluginId: ID!, $shipId: ID!, $outfitId: ID!) {
    pluginShipAddOutfit(
      pluginId: $pluginId
      shipId: $shipId
      outfitId: $outfitId
    ) {
      id
    }
  }
`;
export function usePluginShipAddOutfitMutation(
  baseOptions?: Apollo.MutationHookOptions<
    PluginShipAddOutfitMutation,
    PluginShipAddOutfitMutationVariables
  >
) {
  return Apollo.useMutation<
    PluginShipAddOutfitMutation,
    PluginShipAddOutfitMutationVariables
  >(PluginShipAddOutfitDocument, baseOptions);
}
export type PluginShipAddOutfitMutationHookResult = ReturnType<
  typeof usePluginShipAddOutfitMutation
>;
export const AllPluginOutfitsDocument = gql`
  query AllPluginOutfits {
    allPluginOutfits {
      id
      pluginId
      pluginName
      identity {
        name
        description
      }
      isOutfit {
        outfitType
      }
    }
  }
`;
export function useAllPluginOutfitsQuery(
  baseOptions?: Apollo.QueryHookOptions<
    AllPluginOutfitsQuery,
    AllPluginOutfitsQueryVariables
  >
) {
  return Apollo.useQuery<AllPluginOutfitsQuery, AllPluginOutfitsQueryVariables>(
    AllPluginOutfitsDocument,
    baseOptions
  );
}
export function useAllPluginOutfitsLazyQuery(
  baseOptions?: Apollo.LazyQueryHookOptions<
    AllPluginOutfitsQuery,
    AllPluginOutfitsQueryVariables
  >
) {
  return Apollo.useLazyQuery<
    AllPluginOutfitsQuery,
    AllPluginOutfitsQueryVariables
  >(AllPluginOutfitsDocument, baseOptions);
}
export type AllPluginOutfitsQueryHookResult = ReturnType<
  typeof useAllPluginOutfitsQuery
>;
export type AllPluginOutfitsLazyQueryHookResult = ReturnType<
  typeof useAllPluginOutfitsLazyQuery
>;
export const PluginShipBasicDocument = gql`
  subscription PluginShipBasic($pluginId: ID!, $shipId: ID!) {
    pluginShip(pluginId: $pluginId, id: $shipId) {
      id
      identity {
        name
        description
      }
      isShip {
        category
        nameGeneratorPhrase
      }
      tags {
        tags
      }
    }
  }
`;
export function usePluginShipBasicSubscription(
  baseOptions: Apollo.SubscriptionHookOptions<
    PluginShipBasicSubscription,
    PluginShipBasicSubscriptionVariables
  >
) {
  return Apollo.useSubscription<
    PluginShipBasicSubscription,
    PluginShipBasicSubscriptionVariables
  >(PluginShipBasicDocument, baseOptions);
}
export type PluginShipBasicSubscriptionHookResult = ReturnType<
  typeof usePluginShipBasicSubscription
>;
export const PluginShipCreateDocument = gql`
  mutation PluginShipCreate($pluginId: ID!, $name: String!) {
    pluginShipCreate(pluginId: $pluginId, name: $name) {
      id
    }
  }
`;
export function usePluginShipCreateMutation(
  baseOptions?: Apollo.MutationHookOptions<
    PluginShipCreateMutation,
    PluginShipCreateMutationVariables
  >
) {
  return Apollo.useMutation<
    PluginShipCreateMutation,
    PluginShipCreateMutationVariables
  >(PluginShipCreateDocument, baseOptions);
}
export type PluginShipCreateMutationHookResult = ReturnType<
  typeof usePluginShipCreateMutation
>;
export const PluginShipOutfitsDocument = gql`
  subscription PluginShipOutfits($pluginId: ID!, $shipId: ID!) {
    pluginShip(pluginId: $pluginId, id: $shipId) {
      id
      shipOutfits {
        outfitIds
        outfits {
          id
          isOutfit {
            outfitType
          }
          identity {
            name
          }
        }
      }
    }
  }
`;
export function usePluginShipOutfitsSubscription(
  baseOptions: Apollo.SubscriptionHookOptions<
    PluginShipOutfitsSubscription,
    PluginShipOutfitsSubscriptionVariables
  >
) {
  return Apollo.useSubscription<
    PluginShipOutfitsSubscription,
    PluginShipOutfitsSubscriptionVariables
  >(PluginShipOutfitsDocument, baseOptions);
}
export type PluginShipOutfitsSubscriptionHookResult = ReturnType<
  typeof usePluginShipOutfitsSubscription
>;
export const PluginShipPhysicsDocument = gql`
  subscription PluginShipPhysics($shipId: ID!, $pluginId: ID = "") {
    pluginShip(id: $shipId, pluginId: $pluginId) {
      id
      isShip {
        mass
      }
      size {
        value
      }
    }
  }
`;
export function usePluginShipPhysicsSubscription(
  baseOptions: Apollo.SubscriptionHookOptions<
    PluginShipPhysicsSubscription,
    PluginShipPhysicsSubscriptionVariables
  >
) {
  return Apollo.useSubscription<
    PluginShipPhysicsSubscription,
    PluginShipPhysicsSubscriptionVariables
  >(PluginShipPhysicsDocument, baseOptions);
}
export type PluginShipPhysicsSubscriptionHookResult = ReturnType<
  typeof usePluginShipPhysicsSubscription
>;
export const PluginShipRemoveDocument = gql`
  mutation PluginShipRemove($pluginId: ID!, $shipId: ID!) {
    pluginShipRemove(pluginId: $pluginId, shipId: $shipId)
  }
`;
export function usePluginShipRemoveMutation(
  baseOptions?: Apollo.MutationHookOptions<
    PluginShipRemoveMutation,
    PluginShipRemoveMutationVariables
  >
) {
  return Apollo.useMutation<
    PluginShipRemoveMutation,
    PluginShipRemoveMutationVariables
  >(PluginShipRemoveDocument, baseOptions);
}
export type PluginShipRemoveMutationHookResult = ReturnType<
  typeof usePluginShipRemoveMutation
>;
export const PluginShipRemoveOutfitDocument = gql`
  mutation PluginShipRemoveOutfit(
    $pluginId: ID!
    $shipId: ID!
    $outfitId: ID!
  ) {
    pluginShipRemoveOutfit(
      pluginId: $pluginId
      shipId: $shipId
      outfitId: $outfitId
    ) {
      id
    }
  }
`;
export function usePluginShipRemoveOutfitMutation(
  baseOptions?: Apollo.MutationHookOptions<
    PluginShipRemoveOutfitMutation,
    PluginShipRemoveOutfitMutationVariables
  >
) {
  return Apollo.useMutation<
    PluginShipRemoveOutfitMutation,
    PluginShipRemoveOutfitMutationVariables
  >(PluginShipRemoveOutfitDocument, baseOptions);
}
export type PluginShipRemoveOutfitMutationHookResult = ReturnType<
  typeof usePluginShipRemoveOutfitMutation
>;
export const PluginShipSetCategoryDocument = gql`
  mutation PluginShipSetCategory(
    $pluginId: ID!
    $shipId: ID!
    $category: String!
  ) {
    pluginShipSetCategory(
      pluginId: $pluginId
      shipId: $shipId
      category: $category
    ) {
      id
    }
  }
`;
export function usePluginShipSetCategoryMutation(
  baseOptions?: Apollo.MutationHookOptions<
    PluginShipSetCategoryMutation,
    PluginShipSetCategoryMutationVariables
  >
) {
  return Apollo.useMutation<
    PluginShipSetCategoryMutation,
    PluginShipSetCategoryMutationVariables
  >(PluginShipSetCategoryDocument, baseOptions);
}
export type PluginShipSetCategoryMutationHookResult = ReturnType<
  typeof usePluginShipSetCategoryMutation
>;
export const PluginShipSetDescriptionDocument = gql`
  mutation PluginShipSetDescription(
    $pluginId: ID!
    $shipId: ID!
    $description: String!
  ) {
    pluginShipSetDescription(
      pluginId: $pluginId
      shipId: $shipId
      description: $description
    ) {
      id
      identity {
        description
      }
    }
  }
`;
export function usePluginShipSetDescriptionMutation(
  baseOptions?: Apollo.MutationHookOptions<
    PluginShipSetDescriptionMutation,
    PluginShipSetDescriptionMutationVariables
  >
) {
  return Apollo.useMutation<
    PluginShipSetDescriptionMutation,
    PluginShipSetDescriptionMutationVariables
  >(PluginShipSetDescriptionDocument, baseOptions);
}
export type PluginShipSetDescriptionMutationHookResult = ReturnType<
  typeof usePluginShipSetDescriptionMutation
>;
export const PluginShipSetMassDocument = gql`
  mutation PluginShipSetMass($pluginId: ID!, $shipId: ID!, $mass: Float!) {
    pluginShipSetMass(pluginId: $pluginId, shipId: $shipId, mass: $mass) {
      id
    }
  }
`;
export function usePluginShipSetMassMutation(
  baseOptions?: Apollo.MutationHookOptions<
    PluginShipSetMassMutation,
    PluginShipSetMassMutationVariables
  >
) {
  return Apollo.useMutation<
    PluginShipSetMassMutation,
    PluginShipSetMassMutationVariables
  >(PluginShipSetMassDocument, baseOptions);
}
export type PluginShipSetMassMutationHookResult = ReturnType<
  typeof usePluginShipSetMassMutation
>;
export const PluginShipSetNameDocument = gql`
  mutation PluginShipSetName($pluginId: ID!, $shipId: ID!, $name: String!) {
    pluginShipSetName(pluginId: $pluginId, shipId: $shipId, name: $name) {
      id
      identity {
        name
      }
    }
  }
`;
export function usePluginShipSetNameMutation(
  baseOptions?: Apollo.MutationHookOptions<
    PluginShipSetNameMutation,
    PluginShipSetNameMutationVariables
  >
) {
  return Apollo.useMutation<
    PluginShipSetNameMutation,
    PluginShipSetNameMutationVariables
  >(PluginShipSetNameDocument, baseOptions);
}
export type PluginShipSetNameMutationHookResult = ReturnType<
  typeof usePluginShipSetNameMutation
>;
export const PluginShipSetNameGeneratorPhraseDocument = gql`
  mutation PluginShipSetNameGeneratorPhrase(
    $pluginId: ID!
    $shipId: ID!
    $phraseId: ID
  ) {
    pluginShipSetNameGeneratorPhrase(
      pluginId: $pluginId
      shipId: $shipId
      phraseId: $phraseId
    ) {
      id
    }
  }
`;
export function usePluginShipSetNameGeneratorPhraseMutation(
  baseOptions?: Apollo.MutationHookOptions<
    PluginShipSetNameGeneratorPhraseMutation,
    PluginShipSetNameGeneratorPhraseMutationVariables
  >
) {
  return Apollo.useMutation<
    PluginShipSetNameGeneratorPhraseMutation,
    PluginShipSetNameGeneratorPhraseMutationVariables
  >(PluginShipSetNameGeneratorPhraseDocument, baseOptions);
}
export type PluginShipSetNameGeneratorPhraseMutationHookResult = ReturnType<
  typeof usePluginShipSetNameGeneratorPhraseMutation
>;
export const PluginShipSetSizeDocument = gql`
  mutation PluginShipSetSize($pluginId: ID!, $shipId: ID!, $size: Float!) {
    pluginShipSetSize(pluginId: $pluginId, shipId: $shipId, size: $size) {
      id
    }
  }
`;
export function usePluginShipSetSizeMutation(
  baseOptions?: Apollo.MutationHookOptions<
    PluginShipSetSizeMutation,
    PluginShipSetSizeMutationVariables
  >
) {
  return Apollo.useMutation<
    PluginShipSetSizeMutation,
    PluginShipSetSizeMutationVariables
  >(PluginShipSetSizeDocument, baseOptions);
}
export type PluginShipSetSizeMutationHookResult = ReturnType<
  typeof usePluginShipSetSizeMutation
>;
export const PluginShipSetTagsDocument = gql`
  mutation PluginShipSetTags($pluginId: ID!, $shipId: ID!, $tags: [String!]!) {
    pluginShipSetTags(pluginId: $pluginId, shipId: $shipId, tags: $tags) {
      id
      tags {
        tags
      }
    }
  }
`;
export function usePluginShipSetTagsMutation(
  baseOptions?: Apollo.MutationHookOptions<
    PluginShipSetTagsMutation,
    PluginShipSetTagsMutationVariables
  >
) {
  return Apollo.useMutation<
    PluginShipSetTagsMutation,
    PluginShipSetTagsMutationVariables
  >(PluginShipSetTagsDocument, baseOptions);
}
export type PluginShipSetTagsMutationHookResult = ReturnType<
  typeof usePluginShipSetTagsMutation
>;
export const PluginShipsDocument = gql`
  subscription PluginShips($pluginId: ID!) {
    pluginShips(pluginId: $pluginId) {
      id
      identity {
        name
      }
      isShip {
        category
      }
    }
  }
`;
export function usePluginShipsSubscription(
  baseOptions: Apollo.SubscriptionHookOptions<
    PluginShipsSubscription,
    PluginShipsSubscriptionVariables
  >
) {
  return Apollo.useSubscription<
    PluginShipsSubscription,
    PluginShipsSubscriptionVariables
  >(PluginShipsDocument, baseOptions);
}
export type PluginShipsSubscriptionHookResult = ReturnType<
  typeof usePluginShipsSubscription
>;
export const PluginCreateDocument = gql`
  mutation PluginCreate($name: String!) {
    pluginCreate(name: $name) {
      id
      name
      author
      description
      coverImage
      tags
    }
  }
`;
export function usePluginCreateMutation(
  baseOptions?: Apollo.MutationHookOptions<
    PluginCreateMutation,
    PluginCreateMutationVariables
  >
) {
  return Apollo.useMutation<
    PluginCreateMutation,
    PluginCreateMutationVariables
  >(PluginCreateDocument, baseOptions);
}
export type PluginCreateMutationHookResult = ReturnType<
  typeof usePluginCreateMutation
>;
export const PluginRemoveDocument = gql`
  mutation PluginRemove($id: ID!) {
    pluginRemove(id: $id)
  }
`;
export function usePluginRemoveMutation(
  baseOptions?: Apollo.MutationHookOptions<
    PluginRemoveMutation,
    PluginRemoveMutationVariables
  >
) {
  return Apollo.useMutation<
    PluginRemoveMutation,
    PluginRemoveMutationVariables
  >(PluginRemoveDocument, baseOptions);
}
export type PluginRemoveMutationHookResult = ReturnType<
  typeof usePluginRemoveMutation
>;
export const PluginSetNameDocument = gql`
  mutation PluginSetName($id: ID!, $name: String!) {
    pluginSetName(id: $id, name: $name) {
      id
      name
    }
  }
`;
export function usePluginSetNameMutation(
  baseOptions?: Apollo.MutationHookOptions<
    PluginSetNameMutation,
    PluginSetNameMutationVariables
  >
) {
  return Apollo.useMutation<
    PluginSetNameMutation,
    PluginSetNameMutationVariables
  >(PluginSetNameDocument, baseOptions);
}
export type PluginSetNameMutationHookResult = ReturnType<
  typeof usePluginSetNameMutation
>;
export const PluginSetCoverImageDocument = gql`
  mutation PluginSetCoverImage($id: ID!, $image: Upload!) {
    pluginSetCoverImage(id: $id, image: $image) {
      id
      coverImage
    }
  }
`;
export function usePluginSetCoverImageMutation(
  baseOptions?: Apollo.MutationHookOptions<
    PluginSetCoverImageMutation,
    PluginSetCoverImageMutationVariables
  >
) {
  return Apollo.useMutation<
    PluginSetCoverImageMutation,
    PluginSetCoverImageMutationVariables
  >(PluginSetCoverImageDocument, baseOptions);
}
export type PluginSetCoverImageMutationHookResult = ReturnType<
  typeof usePluginSetCoverImageMutation
>;
export const PluginSetDescriptionDocument = gql`
  mutation PluginSetDescription($id: ID!, $description: String!) {
    pluginSetDescription(id: $id, description: $description) {
      id
      description
    }
  }
`;
export function usePluginSetDescriptionMutation(
  baseOptions?: Apollo.MutationHookOptions<
    PluginSetDescriptionMutation,
    PluginSetDescriptionMutationVariables
  >
) {
  return Apollo.useMutation<
    PluginSetDescriptionMutation,
    PluginSetDescriptionMutationVariables
  >(PluginSetDescriptionDocument, baseOptions);
}
export type PluginSetDescriptionMutationHookResult = ReturnType<
  typeof usePluginSetDescriptionMutation
>;
export const PluginSetTagsDocument = gql`
  mutation PluginSetTags($id: ID!, $tags: [String!]!) {
    pluginSetTags(id: $id, tags: $tags) {
      id
      tags
    }
  }
`;
export function usePluginSetTagsMutation(
  baseOptions?: Apollo.MutationHookOptions<
    PluginSetTagsMutation,
    PluginSetTagsMutationVariables
  >
) {
  return Apollo.useMutation<
    PluginSetTagsMutation,
    PluginSetTagsMutationVariables
  >(PluginSetTagsDocument, baseOptions);
}
export type PluginSetTagsMutationHookResult = ReturnType<
  typeof usePluginSetTagsMutation
>;
export const PluginsDocument = gql`
  subscription Plugins {
    plugins {
      id
      name
      author
      description
      coverImage
      tags
    }
  }
`;
export function usePluginsSubscription(
  baseOptions?: Apollo.SubscriptionHookOptions<
    PluginsSubscription,
    PluginsSubscriptionVariables
  >
) {
  return Apollo.useSubscription<
    PluginsSubscription,
    PluginsSubscriptionVariables
  >(PluginsDocument, baseOptions);
}
export type PluginsSubscriptionHookResult = ReturnType<
  typeof usePluginsSubscription
>;
export const ShipsSetDesiredDestinationDocument = gql`
  mutation ShipsSetDesiredDestination($shipPositions: [ShipPosition!]!) {
    shipsSetDesiredDestination(shipPositions: $shipPositions) {
      id
    }
  }
`;
export function useShipsSetDesiredDestinationMutation(
  baseOptions?: Apollo.MutationHookOptions<
    ShipsSetDesiredDestinationMutation,
    ShipsSetDesiredDestinationMutationVariables
  >
) {
  return Apollo.useMutation<
    ShipsSetDesiredDestinationMutation,
    ShipsSetDesiredDestinationMutationVariables
  >(ShipsSetDesiredDestinationDocument, baseOptions);
}
export type ShipsSetDesiredDestinationMutationHookResult = ReturnType<
  typeof useShipsSetDesiredDestinationMutation
>;
export const ShipsSetPositionDocument = gql`
  mutation ShipsSetPosition($shipPositions: [ShipPosition!]!) {
    shipsSetPosition(shipPositions: $shipPositions) {
      id
    }
  }
`;
export function useShipsSetPositionMutation(
  baseOptions?: Apollo.MutationHookOptions<
    ShipsSetPositionMutation,
    ShipsSetPositionMutationVariables
  >
) {
  return Apollo.useMutation<
    ShipsSetPositionMutation,
    ShipsSetPositionMutationVariables
  >(ShipsSetPositionDocument, baseOptions);
}
export type ShipsSetPositionMutationHookResult = ReturnType<
  typeof useShipsSetPositionMutation
>;
export const UniversePlanetAssetsDocument = gql`
  subscription UniversePlanetAssets($id: ID!, $objectId: ID!) {
    pluginUniverseObject(id: $id, objectId: $objectId) {
      id
      isPlanet {
        textureMapAsset
        cloudsMapAsset
        ringsMapAsset
      }
    }
  }
`;
export function useUniversePlanetAssetsSubscription(
  baseOptions: Apollo.SubscriptionHookOptions<
    UniversePlanetAssetsSubscription,
    UniversePlanetAssetsSubscriptionVariables
  >
) {
  return Apollo.useSubscription<
    UniversePlanetAssetsSubscription,
    UniversePlanetAssetsSubscriptionVariables
  >(UniversePlanetAssetsDocument, baseOptions);
}
export type UniversePlanetAssetsSubscriptionHookResult = ReturnType<
  typeof useUniversePlanetAssetsSubscription
>;
export const PlanetTypesDocument = gql`
  query PlanetTypes {
    planetTypes {
      id
      name
      classification
    }
  }
`;
export function usePlanetTypesQuery(
  baseOptions?: Apollo.QueryHookOptions<
    PlanetTypesQuery,
    PlanetTypesQueryVariables
  >
) {
  return Apollo.useQuery<PlanetTypesQuery, PlanetTypesQueryVariables>(
    PlanetTypesDocument,
    baseOptions
  );
}
export function usePlanetTypesLazyQuery(
  baseOptions?: Apollo.LazyQueryHookOptions<
    PlanetTypesQuery,
    PlanetTypesQueryVariables
  >
) {
  return Apollo.useLazyQuery<PlanetTypesQuery, PlanetTypesQueryVariables>(
    PlanetTypesDocument,
    baseOptions
  );
}
export type PlanetTypesQueryHookResult = ReturnType<typeof usePlanetTypesQuery>;
export type PlanetTypesLazyQueryHookResult = ReturnType<
  typeof usePlanetTypesLazyQuery
>;
export const StarTypesDocument = gql`
  query StarTypes {
    starTypes {
      id
      name
      spectralType
      prevalence
    }
  }
`;
export function useStarTypesQuery(
  baseOptions?: Apollo.QueryHookOptions<StarTypesQuery, StarTypesQueryVariables>
) {
  return Apollo.useQuery<StarTypesQuery, StarTypesQueryVariables>(
    StarTypesDocument,
    baseOptions
  );
}
export function useStarTypesLazyQuery(
  baseOptions?: Apollo.LazyQueryHookOptions<
    StarTypesQuery,
    StarTypesQueryVariables
  >
) {
  return Apollo.useLazyQuery<StarTypesQuery, StarTypesQueryVariables>(
    StarTypesDocument,
    baseOptions
  );
}
export type StarTypesQueryHookResult = ReturnType<typeof useStarTypesQuery>;
export type StarTypesLazyQueryHookResult = ReturnType<
  typeof useStarTypesLazyQuery
>;
export const UniverseAddMoonDocument = gql`
  mutation UniverseAddMoon($id: ID!, $parentId: ID!, $classification: String!) {
    pluginUniverseAddMoon(
      id: $id
      objectId: $parentId
      classification: $classification
    ) {
      id
    }
  }
`;
export function useUniverseAddMoonMutation(
  baseOptions?: Apollo.MutationHookOptions<
    UniverseAddMoonMutation,
    UniverseAddMoonMutationVariables
  >
) {
  return Apollo.useMutation<
    UniverseAddMoonMutation,
    UniverseAddMoonMutationVariables
  >(UniverseAddMoonDocument, baseOptions);
}
export type UniverseAddMoonMutationHookResult = ReturnType<
  typeof useUniverseAddMoonMutation
>;
export const UniverseAddPlanetDocument = gql`
  mutation UniverseAddPlanet(
    $id: ID!
    $parentId: ID!
    $classification: String!
  ) {
    pluginUniverseAddPlanet(
      id: $id
      systemId: $parentId
      classification: $classification
    ) {
      id
    }
  }
`;
export function useUniverseAddPlanetMutation(
  baseOptions?: Apollo.MutationHookOptions<
    UniverseAddPlanetMutation,
    UniverseAddPlanetMutationVariables
  >
) {
  return Apollo.useMutation<
    UniverseAddPlanetMutation,
    UniverseAddPlanetMutationVariables
  >(UniverseAddPlanetDocument, baseOptions);
}
export type UniverseAddPlanetMutationHookResult = ReturnType<
  typeof useUniverseAddPlanetMutation
>;
export const UniverseAddStarDocument = gql`
  mutation UniverseAddStar($id: ID!, $systemId: ID!, $spectralType: String!) {
    pluginUniverseAddStar(
      id: $id
      systemId: $systemId
      spectralType: $spectralType
    ) {
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
export const UniverseAddSystemDocument = gql`
  mutation UniverseAddSystem($id: ID!, $position: PositionInput!) {
    pluginUniverseAddSystem(id: $id, position: $position) {
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
`;
export function useUniverseAddSystemMutation(
  baseOptions?: Apollo.MutationHookOptions<
    UniverseAddSystemMutation,
    UniverseAddSystemMutationVariables
  >
) {
  return Apollo.useMutation<
    UniverseAddSystemMutation,
    UniverseAddSystemMutationVariables
  >(UniverseAddSystemDocument, baseOptions);
}
export type UniverseAddSystemMutationHookResult = ReturnType<
  typeof useUniverseAddSystemMutation
>;
export const UniverseGetObjectDocument = gql`
  query UniverseGetObject($id: ID!, $objectId: ID!) {
    pluginUniverseObject(id: $id, objectId: $objectId) {
      ...UniverseObject
      satellite {
        ...SatelliteComponent
        satellites {
          ...UniverseObject
        }
        parent {
          id
          entityType
          satellite {
            ...SatelliteComponent
            parent {
              id
            }
          }
        }
      }
    }
  }
  ${UniverseObjectFragmentDoc}
  ${SatelliteComponentFragmentDoc}
`;
export function useUniverseGetObjectQuery(
  baseOptions: Apollo.QueryHookOptions<
    UniverseGetObjectQuery,
    UniverseGetObjectQueryVariables
  >
) {
  return Apollo.useQuery<
    UniverseGetObjectQuery,
    UniverseGetObjectQueryVariables
  >(UniverseGetObjectDocument, baseOptions);
}
export function useUniverseGetObjectLazyQuery(
  baseOptions?: Apollo.LazyQueryHookOptions<
    UniverseGetObjectQuery,
    UniverseGetObjectQueryVariables
  >
) {
  return Apollo.useLazyQuery<
    UniverseGetObjectQuery,
    UniverseGetObjectQueryVariables
  >(UniverseGetObjectDocument, baseOptions);
}
export type UniverseGetObjectQueryHookResult = ReturnType<
  typeof useUniverseGetObjectQuery
>;
export type UniverseGetObjectLazyQueryHookResult = ReturnType<
  typeof useUniverseGetObjectLazyQuery
>;
export const UniverseGetSystemDocument = gql`
  query UniverseGetSystem($id: ID!, $systemId: ID!) {
    pluginUniverseSystem(id: $id, systemId: $systemId) {
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
      planetarySystem {
        skyboxKey
      }
    }
  }
`;
export function useUniverseGetSystemQuery(
  baseOptions: Apollo.QueryHookOptions<
    UniverseGetSystemQuery,
    UniverseGetSystemQueryVariables
  >
) {
  return Apollo.useQuery<
    UniverseGetSystemQuery,
    UniverseGetSystemQueryVariables
  >(UniverseGetSystemDocument, baseOptions);
}
export function useUniverseGetSystemLazyQuery(
  baseOptions?: Apollo.LazyQueryHookOptions<
    UniverseGetSystemQuery,
    UniverseGetSystemQueryVariables
  >
) {
  return Apollo.useLazyQuery<
    UniverseGetSystemQuery,
    UniverseGetSystemQueryVariables
  >(UniverseGetSystemDocument, baseOptions);
}
export type UniverseGetSystemQueryHookResult = ReturnType<
  typeof useUniverseGetSystemQuery
>;
export type UniverseGetSystemLazyQueryHookResult = ReturnType<
  typeof useUniverseGetSystemLazyQuery
>;
export const UniverseObjectRemoveDocument = gql`
  mutation UniverseObjectRemove($id: ID!, $objectId: ID!) {
    pluginUniverseRemoveObject(id: $id, objectId: $objectId)
  }
`;
export function useUniverseObjectRemoveMutation(
  baseOptions?: Apollo.MutationHookOptions<
    UniverseObjectRemoveMutation,
    UniverseObjectRemoveMutationVariables
  >
) {
  return Apollo.useMutation<
    UniverseObjectRemoveMutation,
    UniverseObjectRemoveMutationVariables
  >(UniverseObjectRemoveDocument, baseOptions);
}
export type UniverseObjectRemoveMutationHookResult = ReturnType<
  typeof useUniverseObjectRemoveMutation
>;
export const UniversePlanetClearCloudsDocument = gql`
  mutation UniversePlanetClearClouds($id: ID!, $objectId: ID!) {
    pluginUniversePlanetClearClouds(id: $id, objectId: $objectId) {
      id
    }
  }
`;
export function useUniversePlanetClearCloudsMutation(
  baseOptions?: Apollo.MutationHookOptions<
    UniversePlanetClearCloudsMutation,
    UniversePlanetClearCloudsMutationVariables
  >
) {
  return Apollo.useMutation<
    UniversePlanetClearCloudsMutation,
    UniversePlanetClearCloudsMutationVariables
  >(UniversePlanetClearCloudsDocument, baseOptions);
}
export type UniversePlanetClearCloudsMutationHookResult = ReturnType<
  typeof useUniversePlanetClearCloudsMutation
>;
export const UniversePlanetClearRingsDocument = gql`
  mutation UniversePlanetClearRings($id: ID!, $objectId: ID!) {
    pluginUniversePlanetClearRings(id: $id, objectId: $objectId) {
      id
    }
  }
`;
export function useUniversePlanetClearRingsMutation(
  baseOptions?: Apollo.MutationHookOptions<
    UniversePlanetClearRingsMutation,
    UniversePlanetClearRingsMutationVariables
  >
) {
  return Apollo.useMutation<
    UniversePlanetClearRingsMutation,
    UniversePlanetClearRingsMutationVariables
  >(UniversePlanetClearRingsDocument, baseOptions);
}
export type UniversePlanetClearRingsMutationHookResult = ReturnType<
  typeof useUniversePlanetClearRingsMutation
>;
export const UniversePlanetSetAgeDocument = gql`
  mutation UniversePlanetSetAge($id: ID!, $objectId: ID!, $age: Float!) {
    pluginUniversePlanetSetAge(id: $id, objectId: $objectId, age: $age) {
      id
    }
  }
`;
export function useUniversePlanetSetAgeMutation(
  baseOptions?: Apollo.MutationHookOptions<
    UniversePlanetSetAgeMutation,
    UniversePlanetSetAgeMutationVariables
  >
) {
  return Apollo.useMutation<
    UniversePlanetSetAgeMutation,
    UniversePlanetSetAgeMutationVariables
  >(UniversePlanetSetAgeDocument, baseOptions);
}
export type UniversePlanetSetAgeMutationHookResult = ReturnType<
  typeof useUniversePlanetSetAgeMutation
>;
export const UniversePlanetSetCloudsDocument = gql`
  mutation UniversePlanetSetClouds($id: ID!, $objectId: ID!, $image: Upload!) {
    pluginUniversePlanetSetClouds(id: $id, objectId: $objectId, image: $image) {
      id
    }
  }
`;
export function useUniversePlanetSetCloudsMutation(
  baseOptions?: Apollo.MutationHookOptions<
    UniversePlanetSetCloudsMutation,
    UniversePlanetSetCloudsMutationVariables
  >
) {
  return Apollo.useMutation<
    UniversePlanetSetCloudsMutation,
    UniversePlanetSetCloudsMutationVariables
  >(UniversePlanetSetCloudsDocument, baseOptions);
}
export type UniversePlanetSetCloudsMutationHookResult = ReturnType<
  typeof useUniversePlanetSetCloudsMutation
>;
export const UniversePlanetSetHabitableDocument = gql`
  mutation UniversePlanetSetHabitable(
    $id: ID!
    $objectId: ID!
    $habitable: Boolean!
  ) {
    pluginUniversePlanetSetHabitable(
      id: $id
      objectId: $objectId
      habitable: $habitable
    ) {
      id
    }
  }
`;
export function useUniversePlanetSetHabitableMutation(
  baseOptions?: Apollo.MutationHookOptions<
    UniversePlanetSetHabitableMutation,
    UniversePlanetSetHabitableMutationVariables
  >
) {
  return Apollo.useMutation<
    UniversePlanetSetHabitableMutation,
    UniversePlanetSetHabitableMutationVariables
  >(UniversePlanetSetHabitableDocument, baseOptions);
}
export type UniversePlanetSetHabitableMutationHookResult = ReturnType<
  typeof useUniversePlanetSetHabitableMutation
>;
export const UniversePlanetSetLifeformsDocument = gql`
  mutation UniversePlanetSetLifeforms(
    $id: ID!
    $objectId: ID!
    $lifeforms: String!
  ) {
    pluginUniversePlanetSetLifeforms(
      id: $id
      objectId: $objectId
      lifeforms: $lifeforms
    ) {
      id
    }
  }
`;
export function useUniversePlanetSetLifeformsMutation(
  baseOptions?: Apollo.MutationHookOptions<
    UniversePlanetSetLifeformsMutation,
    UniversePlanetSetLifeformsMutationVariables
  >
) {
  return Apollo.useMutation<
    UniversePlanetSetLifeformsMutation,
    UniversePlanetSetLifeformsMutationVariables
  >(UniversePlanetSetLifeformsDocument, baseOptions);
}
export type UniversePlanetSetLifeformsMutationHookResult = ReturnType<
  typeof useUniversePlanetSetLifeformsMutation
>;
export const UniversePlanetSetRadiusDocument = gql`
  mutation UniversePlanetSetRadius($id: ID!, $objectId: ID!, $radius: Float!) {
    pluginUniversePlanetSetRadius(
      id: $id
      objectId: $objectId
      radius: $radius
    ) {
      id
    }
  }
`;
export function useUniversePlanetSetRadiusMutation(
  baseOptions?: Apollo.MutationHookOptions<
    UniversePlanetSetRadiusMutation,
    UniversePlanetSetRadiusMutationVariables
  >
) {
  return Apollo.useMutation<
    UniversePlanetSetRadiusMutation,
    UniversePlanetSetRadiusMutationVariables
  >(UniversePlanetSetRadiusDocument, baseOptions);
}
export type UniversePlanetSetRadiusMutationHookResult = ReturnType<
  typeof useUniversePlanetSetRadiusMutation
>;
export const UniversePlanetSetRingsDocument = gql`
  mutation UniversePlanetSetRings($id: ID!, $objectId: ID!, $image: Upload!) {
    pluginUniversePlanetSetRings(id: $id, objectId: $objectId, image: $image) {
      id
    }
  }
`;
export function useUniversePlanetSetRingsMutation(
  baseOptions?: Apollo.MutationHookOptions<
    UniversePlanetSetRingsMutation,
    UniversePlanetSetRingsMutationVariables
  >
) {
  return Apollo.useMutation<
    UniversePlanetSetRingsMutation,
    UniversePlanetSetRingsMutationVariables
  >(UniversePlanetSetRingsDocument, baseOptions);
}
export type UniversePlanetSetRingsMutationHookResult = ReturnType<
  typeof useUniversePlanetSetRingsMutation
>;
export const UniversePlanetSetTemperatureDocument = gql`
  mutation UniversePlanetSetTemperature(
    $id: ID!
    $objectId: ID!
    $temperature: Float!
  ) {
    pluginUniversePlanetSetTemperature(
      id: $id
      objectId: $objectId
      temperature: $temperature
    ) {
      id
    }
  }
`;
export function useUniversePlanetSetTemperatureMutation(
  baseOptions?: Apollo.MutationHookOptions<
    UniversePlanetSetTemperatureMutation,
    UniversePlanetSetTemperatureMutationVariables
  >
) {
  return Apollo.useMutation<
    UniversePlanetSetTemperatureMutation,
    UniversePlanetSetTemperatureMutationVariables
  >(UniversePlanetSetTemperatureDocument, baseOptions);
}
export type UniversePlanetSetTemperatureMutationHookResult = ReturnType<
  typeof useUniversePlanetSetTemperatureMutation
>;
export const UniversePlanetSetTerranMassDocument = gql`
  mutation UniversePlanetSetTerranMass(
    $id: ID!
    $objectId: ID!
    $terranMass: Float!
  ) {
    pluginUniversePlanetSetTerranMass(
      id: $id
      objectId: $objectId
      terranMass: $terranMass
    ) {
      id
    }
  }
`;
export function useUniversePlanetSetTerranMassMutation(
  baseOptions?: Apollo.MutationHookOptions<
    UniversePlanetSetTerranMassMutation,
    UniversePlanetSetTerranMassMutationVariables
  >
) {
  return Apollo.useMutation<
    UniversePlanetSetTerranMassMutation,
    UniversePlanetSetTerranMassMutationVariables
  >(UniversePlanetSetTerranMassDocument, baseOptions);
}
export type UniversePlanetSetTerranMassMutationHookResult = ReturnType<
  typeof useUniversePlanetSetTerranMassMutation
>;
export const UniversePlanetSetTextureDocument = gql`
  mutation UniversePlanetSetTexture($id: ID!, $objectId: ID!, $image: Upload!) {
    pluginUniversePlanetSetTexture(
      id: $id
      objectId: $objectId
      image: $image
    ) {
      id
    }
  }
`;
export function useUniversePlanetSetTextureMutation(
  baseOptions?: Apollo.MutationHookOptions<
    UniversePlanetSetTextureMutation,
    UniversePlanetSetTextureMutationVariables
  >
) {
  return Apollo.useMutation<
    UniversePlanetSetTextureMutation,
    UniversePlanetSetTextureMutationVariables
  >(UniversePlanetSetTextureDocument, baseOptions);
}
export type UniversePlanetSetTextureMutationHookResult = ReturnType<
  typeof useUniversePlanetSetTextureMutation
>;
export const UniverseSatelliteSetAxialTiltDocument = gql`
  mutation UniverseSatelliteSetAxialTilt(
    $id: ID!
    $objectId: ID!
    $axialTilt: Float!
  ) {
    pluginUniverseSatelliteSetAxialTilt(
      id: $id
      objectId: $objectId
      axialTilt: $axialTilt
    ) {
      id
    }
  }
`;
export function useUniverseSatelliteSetAxialTiltMutation(
  baseOptions?: Apollo.MutationHookOptions<
    UniverseSatelliteSetAxialTiltMutation,
    UniverseSatelliteSetAxialTiltMutationVariables
  >
) {
  return Apollo.useMutation<
    UniverseSatelliteSetAxialTiltMutation,
    UniverseSatelliteSetAxialTiltMutationVariables
  >(UniverseSatelliteSetAxialTiltDocument, baseOptions);
}
export type UniverseSatelliteSetAxialTiltMutationHookResult = ReturnType<
  typeof useUniverseSatelliteSetAxialTiltMutation
>;
export const UniverseSatelliteSetDistanceDocument = gql`
  mutation UniverseSatelliteSetDistance(
    $id: ID!
    $objectId: ID!
    $distance: Float!
  ) {
    pluginUniverseSatelliteSetDistance(
      id: $id
      objectId: $objectId
      distance: $distance
    ) {
      id
    }
  }
`;
export function useUniverseSatelliteSetDistanceMutation(
  baseOptions?: Apollo.MutationHookOptions<
    UniverseSatelliteSetDistanceMutation,
    UniverseSatelliteSetDistanceMutationVariables
  >
) {
  return Apollo.useMutation<
    UniverseSatelliteSetDistanceMutation,
    UniverseSatelliteSetDistanceMutationVariables
  >(UniverseSatelliteSetDistanceDocument, baseOptions);
}
export type UniverseSatelliteSetDistanceMutationHookResult = ReturnType<
  typeof useUniverseSatelliteSetDistanceMutation
>;
export const UniverseSatelliteSetEccentricityDocument = gql`
  mutation UniverseSatelliteSetEccentricity(
    $id: ID!
    $objectId: ID!
    $eccentricity: Float!
  ) {
    pluginUniverseSatelliteSetEccentricity(
      id: $id
      objectId: $objectId
      eccentricity: $eccentricity
    ) {
      id
    }
  }
`;
export function useUniverseSatelliteSetEccentricityMutation(
  baseOptions?: Apollo.MutationHookOptions<
    UniverseSatelliteSetEccentricityMutation,
    UniverseSatelliteSetEccentricityMutationVariables
  >
) {
  return Apollo.useMutation<
    UniverseSatelliteSetEccentricityMutation,
    UniverseSatelliteSetEccentricityMutationVariables
  >(UniverseSatelliteSetEccentricityDocument, baseOptions);
}
export type UniverseSatelliteSetEccentricityMutationHookResult = ReturnType<
  typeof useUniverseSatelliteSetEccentricityMutation
>;
export const UniverseSatelliteSetOrbitalArcDocument = gql`
  mutation UniverseSatelliteSetOrbitalArc(
    $id: ID!
    $objectId: ID!
    $orbitalArc: Float!
  ) {
    pluginUniverseSatelliteSetOrbitalArc(
      id: $id
      objectId: $objectId
      orbitalArc: $orbitalArc
    ) {
      id
    }
  }
`;
export function useUniverseSatelliteSetOrbitalArcMutation(
  baseOptions?: Apollo.MutationHookOptions<
    UniverseSatelliteSetOrbitalArcMutation,
    UniverseSatelliteSetOrbitalArcMutationVariables
  >
) {
  return Apollo.useMutation<
    UniverseSatelliteSetOrbitalArcMutation,
    UniverseSatelliteSetOrbitalArcMutationVariables
  >(UniverseSatelliteSetOrbitalArcDocument, baseOptions);
}
export type UniverseSatelliteSetOrbitalArcMutationHookResult = ReturnType<
  typeof useUniverseSatelliteSetOrbitalArcMutation
>;
export const UniverseSatelliteSetOrbitalInclinationDocument = gql`
  mutation UniverseSatelliteSetOrbitalInclination(
    $id: ID!
    $objectId: ID!
    $orbitalInclination: Float!
  ) {
    pluginUniverseSatelliteSetOrbitalInclination(
      id: $id
      objectId: $objectId
      orbitalInclination: $orbitalInclination
    ) {
      id
    }
  }
`;
export function useUniverseSatelliteSetOrbitalInclinationMutation(
  baseOptions?: Apollo.MutationHookOptions<
    UniverseSatelliteSetOrbitalInclinationMutation,
    UniverseSatelliteSetOrbitalInclinationMutationVariables
  >
) {
  return Apollo.useMutation<
    UniverseSatelliteSetOrbitalInclinationMutation,
    UniverseSatelliteSetOrbitalInclinationMutationVariables
  >(UniverseSatelliteSetOrbitalInclinationDocument, baseOptions);
}
export type UniverseSatelliteSetOrbitalInclinationMutationHookResult = ReturnType<
  typeof useUniverseSatelliteSetOrbitalInclinationMutation
>;
export const UniverseSatelliteSetShowOrbitDocument = gql`
  mutation UniverseSatelliteSetShowOrbit(
    $id: ID!
    $objectId: ID!
    $showOrbit: Boolean!
  ) {
    pluginUniverseSatelliteSetShowOrbit(
      id: $id
      objectId: $objectId
      showOrbit: $showOrbit
    ) {
      id
    }
  }
`;
export function useUniverseSatelliteSetShowOrbitMutation(
  baseOptions?: Apollo.MutationHookOptions<
    UniverseSatelliteSetShowOrbitMutation,
    UniverseSatelliteSetShowOrbitMutationVariables
  >
) {
  return Apollo.useMutation<
    UniverseSatelliteSetShowOrbitMutation,
    UniverseSatelliteSetShowOrbitMutationVariables
  >(UniverseSatelliteSetShowOrbitDocument, baseOptions);
}
export type UniverseSatelliteSetShowOrbitMutationHookResult = ReturnType<
  typeof useUniverseSatelliteSetShowOrbitMutation
>;
export const UniverseSearchDocument = gql`
  query UniverseSearch($id: ID!, $search: String!) {
    pluginUniverseSearch(id: $id, search: $search) {
      id
      identity {
        name
        description
      }
      planetarySystem {
        skyboxKey
      }
      entityType
      satellite {
        parent {
          id
          identity {
            name
          }
          entityType
        }
      }
    }
  }
`;
export function useUniverseSearchQuery(
  baseOptions: Apollo.QueryHookOptions<
    UniverseSearchQuery,
    UniverseSearchQueryVariables
  >
) {
  return Apollo.useQuery<UniverseSearchQuery, UniverseSearchQueryVariables>(
    UniverseSearchDocument,
    baseOptions
  );
}
export function useUniverseSearchLazyQuery(
  baseOptions?: Apollo.LazyQueryHookOptions<
    UniverseSearchQuery,
    UniverseSearchQueryVariables
  >
) {
  return Apollo.useLazyQuery<UniverseSearchQuery, UniverseSearchQueryVariables>(
    UniverseSearchDocument,
    baseOptions
  );
}
export type UniverseSearchQueryHookResult = ReturnType<
  typeof useUniverseSearchQuery
>;
export type UniverseSearchLazyQueryHookResult = ReturnType<
  typeof useUniverseSearchLazyQuery
>;
export const UniverseStarbaseSetPositionDocument = gql`
  mutation UniverseStarbaseSetPosition(
    $pluginId: ID!
    $shipId: ID!
    $position: PositionInput!
  ) {
    pluginUniverseStarbaseSetPosition(
      pluginId: $pluginId
      shipId: $shipId
      position: $position
    ) {
      id
    }
  }
`;
export function useUniverseStarbaseSetPositionMutation(
  baseOptions?: Apollo.MutationHookOptions<
    UniverseStarbaseSetPositionMutation,
    UniverseStarbaseSetPositionMutationVariables
  >
) {
  return Apollo.useMutation<
    UniverseStarbaseSetPositionMutation,
    UniverseStarbaseSetPositionMutationVariables
  >(UniverseStarbaseSetPositionDocument, baseOptions);
}
export type UniverseStarbaseSetPositionMutationHookResult = ReturnType<
  typeof useUniverseStarbaseSetPositionMutation
>;
export const UniverseStarSetAgeDocument = gql`
  mutation UniverseStarSetAge($id: ID!, $objectId: ID!, $age: Float!) {
    pluginUniverseStarSetAge(id: $id, objectId: $objectId, age: $age) {
      id
    }
  }
`;
export function useUniverseStarSetAgeMutation(
  baseOptions?: Apollo.MutationHookOptions<
    UniverseStarSetAgeMutation,
    UniverseStarSetAgeMutationVariables
  >
) {
  return Apollo.useMutation<
    UniverseStarSetAgeMutation,
    UniverseStarSetAgeMutationVariables
  >(UniverseStarSetAgeDocument, baseOptions);
}
export type UniverseStarSetAgeMutationHookResult = ReturnType<
  typeof useUniverseStarSetAgeMutation
>;
export const UniverseStarSetHueDocument = gql`
  mutation UniverseStarSetHue($id: ID!, $objectId: ID!, $hue: Float!) {
    pluginUniverseStarSetHue(id: $id, objectId: $objectId, hue: $hue) {
      id
    }
  }
`;
export function useUniverseStarSetHueMutation(
  baseOptions?: Apollo.MutationHookOptions<
    UniverseStarSetHueMutation,
    UniverseStarSetHueMutationVariables
  >
) {
  return Apollo.useMutation<
    UniverseStarSetHueMutation,
    UniverseStarSetHueMutationVariables
  >(UniverseStarSetHueDocument, baseOptions);
}
export type UniverseStarSetHueMutationHookResult = ReturnType<
  typeof useUniverseStarSetHueMutation
>;
export const UniverseStarSetIsWhiteDocument = gql`
  mutation UniverseStarSetIsWhite(
    $id: ID!
    $objectId: ID!
    $isWhite: Boolean!
  ) {
    pluginUniverseStarSetIsWhite(
      id: $id
      objectId: $objectId
      isWhite: $isWhite
    ) {
      id
    }
  }
`;
export function useUniverseStarSetIsWhiteMutation(
  baseOptions?: Apollo.MutationHookOptions<
    UniverseStarSetIsWhiteMutation,
    UniverseStarSetIsWhiteMutationVariables
  >
) {
  return Apollo.useMutation<
    UniverseStarSetIsWhiteMutation,
    UniverseStarSetIsWhiteMutationVariables
  >(UniverseStarSetIsWhiteDocument, baseOptions);
}
export type UniverseStarSetIsWhiteMutationHookResult = ReturnType<
  typeof useUniverseStarSetIsWhiteMutation
>;
export const UniverseStarSetRadiusDocument = gql`
  mutation UniverseStarSetRadius($id: ID!, $objectId: ID!, $radius: Float!) {
    pluginUniverseStarSetRadius(id: $id, objectId: $objectId, radius: $radius) {
      id
    }
  }
`;
export function useUniverseStarSetRadiusMutation(
  baseOptions?: Apollo.MutationHookOptions<
    UniverseStarSetRadiusMutation,
    UniverseStarSetRadiusMutationVariables
  >
) {
  return Apollo.useMutation<
    UniverseStarSetRadiusMutation,
    UniverseStarSetRadiusMutationVariables
  >(UniverseStarSetRadiusDocument, baseOptions);
}
export type UniverseStarSetRadiusMutationHookResult = ReturnType<
  typeof useUniverseStarSetRadiusMutation
>;
export const UniverseStarSetSolarMassDocument = gql`
  mutation UniverseStarSetSolarMass(
    $id: ID!
    $objectId: ID!
    $solarMass: Float!
  ) {
    pluginUniverseStarSetSolarMass(
      id: $id
      objectId: $objectId
      solarMass: $solarMass
    ) {
      id
    }
  }
`;
export function useUniverseStarSetSolarMassMutation(
  baseOptions?: Apollo.MutationHookOptions<
    UniverseStarSetSolarMassMutation,
    UniverseStarSetSolarMassMutationVariables
  >
) {
  return Apollo.useMutation<
    UniverseStarSetSolarMassMutation,
    UniverseStarSetSolarMassMutationVariables
  >(UniverseStarSetSolarMassDocument, baseOptions);
}
export type UniverseStarSetSolarMassMutationHookResult = ReturnType<
  typeof useUniverseStarSetSolarMassMutation
>;
export const UniverseStarSetTemperatureDocument = gql`
  mutation UniverseStarSetTemperature(
    $id: ID!
    $objectId: ID!
    $temperature: Float!
  ) {
    pluginUniverseStarSetTemperature(
      id: $id
      objectId: $objectId
      temperature: $temperature
    ) {
      id
    }
  }
`;
export function useUniverseStarSetTemperatureMutation(
  baseOptions?: Apollo.MutationHookOptions<
    UniverseStarSetTemperatureMutation,
    UniverseStarSetTemperatureMutationVariables
  >
) {
  return Apollo.useMutation<
    UniverseStarSetTemperatureMutation,
    UniverseStarSetTemperatureMutationVariables
  >(UniverseStarSetTemperatureDocument, baseOptions);
}
export type UniverseStarSetTemperatureMutationHookResult = ReturnType<
  typeof useUniverseStarSetTemperatureMutation
>;
export const UniverseDocument = gql`
  subscription Universe($id: ID!) {
    pluginUniverse(id: $id, entityType: system) {
      id
      entityType
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
      planetarySystem {
        skyboxKey
      }
    }
  }
`;
export function useUniverseSubscription(
  baseOptions: Apollo.SubscriptionHookOptions<
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
export const UniverseAddStarbaseDocument = gql`
  mutation UniverseAddStarbase(
    $pluginId: ID!
    $systemId: ID!
    $shipId: ID!
    $position: CoordinatesInput!
  ) {
    pluginUniverseAddStarbase(
      pluginId: $pluginId
      systemId: $systemId
      shipId: $shipId
      position: $position
    ) {
      id
    }
  }
`;
export function useUniverseAddStarbaseMutation(
  baseOptions?: Apollo.MutationHookOptions<
    UniverseAddStarbaseMutation,
    UniverseAddStarbaseMutationVariables
  >
) {
  return Apollo.useMutation<
    UniverseAddStarbaseMutation,
    UniverseAddStarbaseMutationVariables
  >(UniverseAddStarbaseDocument, baseOptions);
}
export type UniverseAddStarbaseMutationHookResult = ReturnType<
  typeof useUniverseAddStarbaseMutation
>;
export const UniverseSystemSetDescriptionDocument = gql`
  mutation UniverseSystemSetDescription(
    $id: ID!
    $systemId: ID!
    $description: String!
  ) {
    pluginUniverseSystemSetDescription(
      id: $id
      systemId: $systemId
      description: $description
    ) {
      id
    }
  }
`;
export function useUniverseSystemSetDescriptionMutation(
  baseOptions?: Apollo.MutationHookOptions<
    UniverseSystemSetDescriptionMutation,
    UniverseSystemSetDescriptionMutationVariables
  >
) {
  return Apollo.useMutation<
    UniverseSystemSetDescriptionMutation,
    UniverseSystemSetDescriptionMutationVariables
  >(UniverseSystemSetDescriptionDocument, baseOptions);
}
export type UniverseSystemSetDescriptionMutationHookResult = ReturnType<
  typeof useUniverseSystemSetDescriptionMutation
>;
export const UniverseSystemSetNameDocument = gql`
  mutation UniverseSystemSetName($id: ID!, $systemId: ID!, $name: String!) {
    pluginUniverseSystemSetName(id: $id, systemId: $systemId, name: $name) {
      id
    }
  }
`;
export function useUniverseSystemSetNameMutation(
  baseOptions?: Apollo.MutationHookOptions<
    UniverseSystemSetNameMutation,
    UniverseSystemSetNameMutationVariables
  >
) {
  return Apollo.useMutation<
    UniverseSystemSetNameMutation,
    UniverseSystemSetNameMutationVariables
  >(UniverseSystemSetNameDocument, baseOptions);
}
export type UniverseSystemSetNameMutationHookResult = ReturnType<
  typeof useUniverseSystemSetNameMutation
>;
export const UniverseSystemSetPositionDocument = gql`
  mutation UniverseSystemSetPosition(
    $id: ID!
    $systemId: ID!
    $position: PositionInput!
  ) {
    pluginUniverseSystemSetPosition(
      id: $id
      systemId: $systemId
      position: $position
    ) {
      id
    }
  }
`;
export function useUniverseSystemSetPositionMutation(
  baseOptions?: Apollo.MutationHookOptions<
    UniverseSystemSetPositionMutation,
    UniverseSystemSetPositionMutationVariables
  >
) {
  return Apollo.useMutation<
    UniverseSystemSetPositionMutation,
    UniverseSystemSetPositionMutationVariables
  >(UniverseSystemSetPositionDocument, baseOptions);
}
export type UniverseSystemSetPositionMutationHookResult = ReturnType<
  typeof useUniverseSystemSetPositionMutation
>;
export const UniverseSystemSetSkyboxDocument = gql`
  mutation UniverseSystemSetSkybox(
    $id: ID!
    $systemId: ID!
    $skyboxKey: String!
  ) {
    pluginUniverseSystemSetSkyboxKey(
      id: $id
      systemId: $systemId
      skyboxKey: $skyboxKey
    ) {
      id
    }
  }
`;
export function useUniverseSystemSetSkyboxMutation(
  baseOptions?: Apollo.MutationHookOptions<
    UniverseSystemSetSkyboxMutation,
    UniverseSystemSetSkyboxMutationVariables
  >
) {
  return Apollo.useMutation<
    UniverseSystemSetSkyboxMutation,
    UniverseSystemSetSkyboxMutationVariables
  >(UniverseSystemSetSkyboxDocument, baseOptions);
}
export type UniverseSystemSetSkyboxMutationHookResult = ReturnType<
  typeof useUniverseSystemSetSkyboxMutation
>;
export const TemplateSystemDocument = gql`
  subscription TemplateSystem($id: ID!, $systemId: ID!) {
    pluginUniverseSystem(id: $id, systemId: $systemId) {
      id
      identity {
        name
        description
      }
      planetarySystem {
        skyboxKey
      }
      habitableZoneInner
      habitableZoneOuter
      items {
        ...UniverseObject
        satellite {
          ...SatelliteComponent
          satellites {
            ...UniverseObject
          }
        }
      }
    }
  }
  ${UniverseObjectFragmentDoc}
  ${SatelliteComponentFragmentDoc}
`;
export function useTemplateSystemSubscription(
  baseOptions: Apollo.SubscriptionHookOptions<
    TemplateSystemSubscription,
    TemplateSystemSubscriptionVariables
  >
) {
  return Apollo.useSubscription<
    TemplateSystemSubscription,
    TemplateSystemSubscriptionVariables
  >(TemplateSystemDocument, baseOptions);
}
export type TemplateSystemSubscriptionHookResult = ReturnType<
  typeof useTemplateSystemSubscription
>;
export const UniverseSystemShipsDocument = gql`
  subscription UniverseSystemShips($systemId: ID!) {
    universeSystemShips(systemId: $systemId) {
      id
      identity {
        name
      }
      position {
        x
        y
        z
      }
      rotation {
        x
        y
        z
        w
      }
      autopilot {
        desiredCoordinates {
          x
          y
          z
        }
      }
      size {
        value
      }
      shipAssets {
        model
      }
    }
  }
`;
export function useUniverseSystemShipsSubscription(
  baseOptions: Apollo.SubscriptionHookOptions<
    UniverseSystemShipsSubscription,
    UniverseSystemShipsSubscriptionVariables
  >
) {
  return Apollo.useSubscription<
    UniverseSystemShipsSubscription,
    UniverseSystemShipsSubscriptionVariables
  >(UniverseSystemShipsDocument, baseOptions);
}
export type UniverseSystemShipsSubscriptionHookResult = ReturnType<
  typeof useUniverseSystemShipsSubscription
>;
export const UniverseSystemShipsHotDocument = gql`
  subscription UniverseSystemShipsHot(
    $systemId: ID!
    $autopilotIncluded: Boolean = false
  ) {
    universeSystemShipsHot(systemId: $systemId) {
      id
      position {
        x
        y
        z
      }
      rotation {
        x
        y
        z
        w
      }
      autopilot @include(if: $autopilotIncluded) {
        desiredCoordinates {
          x
          y
          z
        }
      }
    }
  }
`;
export function useUniverseSystemShipsHotSubscription(
  baseOptions: Apollo.SubscriptionHookOptions<
    UniverseSystemShipsHotSubscription,
    UniverseSystemShipsHotSubscriptionVariables
  >
) {
  return Apollo.useSubscription<
    UniverseSystemShipsHotSubscription,
    UniverseSystemShipsHotSubscriptionVariables
  >(UniverseSystemShipsHotDocument, baseOptions);
}
export type UniverseSystemShipsHotSubscriptionHookResult = ReturnType<
  typeof useUniverseSystemShipsHotSubscription
>;
export const UniverseSystemDocument = gql`
  subscription UniverseSystem($systemId: ID!) {
    universeSystem(systemId: $systemId) {
      id
      identity {
        name
        description
      }
      planetarySystem {
        skyboxKey
      }
      habitableZoneInner
      habitableZoneOuter
      items {
        ...UniverseObject
        satellite {
          ...SatelliteComponent
          satellites {
            ...UniverseObject
          }
        }
      }
    }
  }
  ${UniverseObjectFragmentDoc}
  ${SatelliteComponentFragmentDoc}
`;
export function useUniverseSystemSubscription(
  baseOptions: Apollo.SubscriptionHookOptions<
    UniverseSystemSubscription,
    UniverseSystemSubscriptionVariables
  >
) {
  return Apollo.useSubscription<
    UniverseSystemSubscription,
    UniverseSystemSubscriptionVariables
  >(UniverseSystemDocument, baseOptions);
}
export type UniverseSystemSubscriptionHookResult = ReturnType<
  typeof useUniverseSystemSubscription
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
export const FlightStartDocument = gql`
  mutation FlightStart(
    $name: String
    $plugins: [ID!]!
    $simulators: [FlightStartSimulator!]!
  ) {
    flightStart(flightName: $name, plugins: $plugins, simulators: $simulators) {
      id
      name
      paused
      date
    }
  }
`;
export function useFlightStartMutation(
  baseOptions?: Apollo.MutationHookOptions<
    FlightStartMutation,
    FlightStartMutationVariables
  >
) {
  return Apollo.useMutation<FlightStartMutation, FlightStartMutationVariables>(
    FlightStartDocument,
    baseOptions
  );
}
export type FlightStartMutationHookResult = ReturnType<
  typeof useFlightStartMutation
>;
export const ActiveFlightDocument = gql`
  query ActiveFlight {
    flight {
      id
    }
  }
`;
export function useActiveFlightQuery(
  baseOptions?: Apollo.QueryHookOptions<
    ActiveFlightQuery,
    ActiveFlightQueryVariables
  >
) {
  return Apollo.useQuery<ActiveFlightQuery, ActiveFlightQueryVariables>(
    ActiveFlightDocument,
    baseOptions
  );
}
export function useActiveFlightLazyQuery(
  baseOptions?: Apollo.LazyQueryHookOptions<
    ActiveFlightQuery,
    ActiveFlightQueryVariables
  >
) {
  return Apollo.useLazyQuery<ActiveFlightQuery, ActiveFlightQueryVariables>(
    ActiveFlightDocument,
    baseOptions
  );
}
export type ActiveFlightQueryHookResult = ReturnType<
  typeof useActiveFlightQuery
>;
export type ActiveFlightLazyQueryHookResult = ReturnType<
  typeof useActiveFlightLazyQuery
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
