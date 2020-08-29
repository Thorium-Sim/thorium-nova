import {ClientResolver} from "./client";
import {EntityFieldResolver, EntityResolver} from "./ecs";
import {FlightResolver} from "./flight";
import {ShipAssetsResolver, ShipPluginResolver} from "./plugins/ship";
import {StationComplementPluginResolver} from "./plugins/stationComplement";
import {UniversePluginBaseResolver} from "./plugins/universe";
import {
  PlanetAssetsResolver,
  UniversePluginPlanetsResolver,
} from "./plugins/universe/planets";
import PlanetTypeResolver from "./plugins/universe/planetTypes";
import {UniverseSatelliteResolver} from "./plugins/universe/satellite";
import {UniversePluginStarsResolver} from "./plugins/universe/stars";
import StarTypeResolver from "./plugins/universe/starTypes";
import {
  PlanetarySystemResolver,
  SatelliteComponentResolver,
  UniversePluginSystemsResolver,
} from "./plugins/universe/systems";
import {RootResolver} from "./root";
import {ShipResolver} from "./ship";
import {TimerResolver} from "./timer";

type ResolverT =
  | readonly [Function, ...Function[]]
  | [Function, ...Function[]]
  | readonly [string, ...string[]]
  | [string, ...string[]];

export const resolvers: ResolverT = [
  RootResolver,
  ClientResolver,
  FlightResolver,
  EntityResolver,
  TimerResolver,
  ShipResolver,
  ShipPluginResolver,
  StationComplementPluginResolver,
  ShipAssetsResolver,
  EntityFieldResolver,
  UniversePluginBaseResolver,
  UniversePluginSystemsResolver,
  StarTypeResolver,
  PlanetTypeResolver,
  UniversePluginStarsResolver,
  PlanetarySystemResolver,
  UniversePluginPlanetsResolver,
  UniverseSatelliteResolver,
  PlanetAssetsResolver,
  SatelliteComponentResolver,
];
