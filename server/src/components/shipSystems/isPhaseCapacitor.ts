import z from "zod";

// Applied to batteries to indicate they are used for phaser systems
export const isPhaseCapacitor = z.object({}).default({});
