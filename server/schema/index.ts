import {ClientResolver} from "./client";
import {EntityResolver} from "./ecs";
import {FlightResolver} from "./flight";
import {ShipPluginResolver} from "./plugins/ship";
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
];
