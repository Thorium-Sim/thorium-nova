import z from "zod";

export const flightStartShips = z
	.array(
		z.object({
			crewCount: z.number(),
			shipName: z.string(),
			theme: z.object({ pluginId: z.string(), themeId: z.string() }).optional(),
			shipTemplate: z.object({
				pluginId: z.string(),
				shipId: z.string(),
			}),
			stationComplement: z.object({ pluginId: z.string(), stationId: z.string() }).optional(),
		}),
	)
	.nonempty();
