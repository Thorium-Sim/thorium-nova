import * as allComponents from "./list";

type AllComponents = typeof allComponents;
type ComponentKeys = keyof AllComponents;

export type ComponentIDs = AllComponents[ComponentKeys]["id"];

export type ComponentProperties = {
  [P in ComponentKeys as AllComponents[P]["id"]]: AllComponents[P]["defaults"];
};

export {allComponents as components};
