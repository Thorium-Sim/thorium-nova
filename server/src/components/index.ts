import * as allComponents from "./list";

type AllComponents = typeof allComponents;
type ComponentKeys = keyof AllComponents;

export type ComponentIDs = AllComponents[ComponentKeys]["id"];

export type ComponentProperties = {
  [P in ComponentKeys as AllComponents[P]["id"]]: Omit<
    InstanceType<AllComponents[P]>,
    "init"
  >;
};

export {allComponents as components};
