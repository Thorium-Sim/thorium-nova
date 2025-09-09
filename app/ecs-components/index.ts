import * as allComponents from "./list";
import type z from "zod";

type AllComponents = typeof allComponents;
export type ComponentIds = keyof AllComponents;

export type ComponentProperties = {
	[P in ComponentIds]: z.infer<AllComponents[P]>;
};
export type ComponentInputs = {
	[P in ComponentIds]: z.input<AllComponents[P]>;
};

export { allComponents as components };
