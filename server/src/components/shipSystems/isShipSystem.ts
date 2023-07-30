import z from "zod";
import {ShipSystemTypes} from "server/src/classes/Plugins/ShipSystems/shipSystemTypes";
import {LiteralTuple, TuplifyUnion} from "@server/utils/types";

const shipSystemTypes = Object.keys(ShipSystemTypes).map(key =>
  z.literal(key as any)
) as LiteralTuple<TuplifyUnion<keyof typeof ShipSystemTypes>>;

export const isShipSystem = z
  .object({
    type: z.union(shipSystemTypes).default("generic"),
  })
  .default({});
