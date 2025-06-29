import { t } from "./t";
import * as client from "@thorium/.server/data";
import * as cards from "@thorium/cards/data.server";
import * as cores from "@thorium/cores/data.server";

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

export type AppRouter = typeof router;
