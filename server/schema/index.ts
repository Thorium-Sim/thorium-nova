import {ClientResolver} from "./client";
import {FlightResolver} from "./flight";

export const resolvers:
  | readonly [Function, ...Function[]]
  | [Function, ...Function[]]
  | readonly [string, ...string[]]
  | [string, ...string[]] = [ClientResolver, FlightResolver];
