import * as allComponents from "./list";

type AllComponents = typeof allComponents;
export type ComponentIds = keyof AllComponents;

export type ComponentProperties = {
	[P in ComponentIds]: Zod.infer<AllComponents[P]>;
};
export type ComponentInputs = {
	[P in ComponentIds]: Zod.input<AllComponents[P]>;
};

export { allComponents as components };
