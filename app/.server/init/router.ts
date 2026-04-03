import { t } from "./t";
import * as client from "@thorium/.server/data";
import * as cards from "@thorium/cards/data.server";
import * as cores from "@thorium/cores/data.server";
import type { ComponentIds } from "@thorium/ecs-components";
import type { Entity } from "@thorium/utils/ecs";

// @ts-expect-error TypeScript's being too helpful
const { default: _, ...allCards } = cards;
// @ts-expect-error TypeScript's being too helpful
const { default: __, ...allCores } = cores;
// @ts-expect-error TypeScript's being too helpful
const { default: ___, plugin, publish, ...allClient } = client;

export const router = t.router({
	plugin,
	...allClient,
	...allCards,
	...allCores,
});

export const componentEntityMaps = new Map<
	ComponentIds,
	Set<{ procedure: string; entityMap: (entity: Entity) => any | any[] }>
>();

// Activate the auto-publish behavior
for (const [name, route] of Object.entries(router._def.procedures) as any) {
	if (!route._def.request) continue;
	if (!route._def.components || !route._def.entityMap) {
		if (name.startsWith("plugin.")) continue;
		console.warn(`Route ${name} missing auto publish properties`);
		continue;
	}
	for (const component of route._def.components) {
		if (!componentEntityMaps.has(component)) {
			componentEntityMaps.set(component, new Set());
		}
		componentEntityMaps.get(component)?.add({
			procedure: name,
			entityMap: route._def.entityMap,
		});
	}
}

export type AppRouter = typeof router;

export type AllSends<T = AppRouter> = {
	[Key in keyof T & string]: "_def" extends Key
		? never
		: T[Key] extends { _type: "send" }
			? Key
			: T[Key] extends object
				? `${Key}.${AllSends<T[Key]>}`
				: never;
}[keyof T & string];

export type SendInputs<
	Path extends string,
	T = AppRouter,
> = Path extends `${infer First}.${infer Rest}`
	? // Recursive case: there's a dot, drill down
		First extends keyof T
		? SendInputs<Rest, T[First]>
		: never
	: // Base case: no dot left, Path is the final key
		Path extends keyof T
		? T[Path] extends { _type: "send"; _def: { _input_in: infer r } }
			? r extends Record<string, any>
				? r
				: never
			: never
		: never;
