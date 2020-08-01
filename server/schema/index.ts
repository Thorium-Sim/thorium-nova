import {ClientResolver} from "./client";
import {EntityFieldResolver, EntityResolver} from "./ecs";
import {FlightResolver} from "./flight";
import {ShipAssetsResolver, ShipPluginResolver} from "./plugins/ship";
import {StationComplementPluginResolver} from "./plugins/stationComplement";
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
];
