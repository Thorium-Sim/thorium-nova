import z from "zod";

export const isSolarSystem = z
  .object({
    // Measured in AU
    habitableZoneInner: z.number().default(0.9),
    habitableZoneOuter: z.number().default(3.0),
    skyboxKey: z.string().default("Random Key"),
  })
  .default({});
