import {
  TemplateSystemSubscription,
  UniverseSubscription,
} from "../../../generated/graphql";

export function hasOrbit(
  obj: any
): obj is {
  satellite: NonNullable<
    TemplateSystemSubscription["templateUniverseSystem"]["items"][0]["satellite"]
  >;
} {
  return !!obj.satellite;
}
export function isStar(
  obj: any
): obj is {
  isStar: NonNullable<
    TemplateSystemSubscription["templateUniverseSystem"]["items"][0]["isStar"]
  >;
  temperature: NonNullable<
    TemplateSystemSubscription["templateUniverseSystem"]["items"][0]["temperature"]
  >;
} {
  return !!obj.isStar;
}
export function isPlanet(
  obj: any
): obj is {
  isPlanet: NonNullable<
    TemplateSystemSubscription["templateUniverseSystem"]["items"][0]["isPlanet"]
  >;
  temperature: NonNullable<
    TemplateSystemSubscription["templateUniverseSystem"]["items"][0]["temperature"]
  >;
} {
  return !!obj?.isPlanet;
}

export function isSystem(
  obj: any
): obj is NonNullable<TemplateSystemSubscription["templateUniverseSystem"]> {
  return !!obj.planetarySystem;
}
export function hasPosition(
  obj: any
): obj is {
  position: NonNullable<
    UniverseSubscription["universe"]
  >["systems"][0]["position"];
} {
  return !!obj?.position;
}
