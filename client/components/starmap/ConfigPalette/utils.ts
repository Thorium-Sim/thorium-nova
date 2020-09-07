import {
  TemplateSystemSubscription,
  UniverseSubscription,
} from "../../../generated/graphql";

export function hasOrbit(
  obj: any
): obj is {
  satellite: NonNullable<
    TemplateSystemSubscription["pluginUniverseSystem"]["items"][0]["satellite"]
  >;
} {
  return !!obj.satellite;
}
export function isStar(
  obj: any
): obj is {
  isStar: NonNullable<
    TemplateSystemSubscription["pluginUniverseSystem"]["items"][0]["isStar"]
  >;
  temperature: NonNullable<
    TemplateSystemSubscription["pluginUniverseSystem"]["items"][0]["temperature"]
  >;
} {
  return !!obj.isStar;
}
export function isPlanet(
  obj: any
): obj is {
  isPlanet: NonNullable<
    TemplateSystemSubscription["pluginUniverseSystem"]["items"][0]["isPlanet"]
  >;
  temperature: NonNullable<
    TemplateSystemSubscription["pluginUniverseSystem"]["items"][0]["temperature"]
  >;
} {
  return !!obj?.isPlanet;
}

export function isSystem(
  obj: any
): obj is NonNullable<TemplateSystemSubscription["pluginUniverseSystem"]> {
  return !!obj.planetarySystem;
}
export function hasPosition(
  obj: any
): obj is {
  position: NonNullable<UniverseSubscription["pluginUniverse"]>[0]["position"];
} {
  return !!obj?.position;
}
