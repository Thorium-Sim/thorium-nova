import { damageEffects, damageTypes } from "@thorium/utils/flags/damageTypes";
import z from "zod";

// The damage report itself is handled through the timeline component
export const damageReport = z.object({
	shipId: z.number(),
	systemId: z.number(),
	damageType: damageTypes,
	effects: z.record(z.number(), z.enum(damageEffects)),
});
