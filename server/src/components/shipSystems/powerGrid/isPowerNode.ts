import z from "zod";

export const isPowerNode = z
  .object({
    /**
     * The systems that are associated with this power node
     */
    connectedSystems: z.array(z.number()).default([]),
    /**
     * The number of incoming connections which this power node supports
     */
    maxConnections: z.number().default(3),
    /**
     * How the power is distributed through the connected systems:
     * - Evenly (fill up systems evenly until the system is full)
     * - Least Need First (first fill up the systems with the smallest power requirement)
     * - Most Need First (first fill up the systems with the largest power requirement)
     */
    distributionMode: z
      .enum(["evenly", "leastFirst", "mostFirst"])
      .default("evenly"),
    /**
     * How much power is being put into the power node, updated every frame
     */
    powerInput: z.number().default(0),
    /**
     * How much power the power node needs, updated every frame
     */
    powerRequirement: z.number().default(0),
  })
  .default({});
