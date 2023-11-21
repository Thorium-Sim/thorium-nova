import z from "zod";

export const physicsHandles = z
  .object({
    /**
     * The key is the world's entity id, the value is the handle.
     */
    handles: z.map(z.number(), z.number()).default(new Map()),
  })
  .default({});
