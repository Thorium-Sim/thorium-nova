import {ClientResolver} from "./client";
import {EntityResolver} from "./ecs";
import {FlightResolver} from "./flight";

export const resolvers:
  | readonly [Function, ...Function[]]
  | [Function, ...Function[]]
  | readonly [string, ...string[]]
  | [string, ...string[]] = [ClientResolver, FlightResolver, EntityResolver];
