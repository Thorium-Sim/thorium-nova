import {t} from "./t";
import {
  client,
  effects,
  flight,
  ship,
  server,
  thorium,
  station,
  theme,
} from "@client/data";
import {plugin} from "@client/pages/Config/data";
import * as cards from "@client/cards/data";
import * as cores from "@client/cores/data";

// @ts-expect-error TypeScript's being too helpful
const {default: _, ...allCards} = cards;
// @ts-expect-error TypeScript's being too helpful
const {default: __, ...allCores} = cores;
export const router = t.router({
  server,
  thorium,
  client,
  flight,
  ship,
  effects,
  station,
  plugin,
  theme,
  ...allCards,
  ...allCores,
});

export type AppRouter = typeof router;
