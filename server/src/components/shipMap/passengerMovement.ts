import z from "zod";

export const passengerMovement = z
  .object({
    /** TODO June 16, 2022 - Some day it should be possible to connect from one ship to another and have entities move between them. */
    destinationNode: z.number().nullable().default(null),
    nodePath: z.array(z.number()).default([]),
    nextNodeIndex: z.number().default(0),

    movementMaxVelocity: z
      .object({
        x: z.number().default(3),
        y: z.number().default(3),
        z: z.number().default(3 / 10), // The Z default is because decks are 10 meters high, so it should take 10x as long to move between decks.
      })
      .default({}),
  })
  .default({});
