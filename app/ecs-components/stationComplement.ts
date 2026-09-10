import { stationSchema } from "@thorium/ecs-components/stationComplementSchema";
import z from "zod";

export const stationComplement = z
	.object({
		name: z.string().default("Station Complement"),
		stations: z.array(stationSchema).default([]),
		crewCount: z.number().default(0),
	})
	.default({});
