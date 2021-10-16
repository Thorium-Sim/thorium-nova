import * as allComponents from "./list";

type AllComponents = typeof allComponents;
type ComponentKeys = keyof AllComponents;

export type ComponentIDs = AllComponents[ComponentKeys]["id"];

export type ComponentProperties = {
  [P in ComponentKeys as AllComponents[P]["id"]]: Omit<
    ReturnClass<AllComponents[P]>,
    "init"
  >;
};

type ReturnClass<T> = T extends {new (): infer U} ? U : never;

export {allComponents as components};
