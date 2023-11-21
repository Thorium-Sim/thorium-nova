import z from "zod";

const systemRooms = z.object({roomId: z.number().optional()}).default({});

export const shipSystems = z
  .object({
    /**
     * The IDs of the ship system entities assigned to this ship
     * and the rooms they are assigned to
     */
    shipSystems: z
      .union([
        z.array(z.tuple([z.number(), systemRooms])),
        z.map(z.number(), systemRooms),
      ])
      .default([])
      .transform(val => (val instanceof Map ? val : new Map(val))),
  })
  .default({});
