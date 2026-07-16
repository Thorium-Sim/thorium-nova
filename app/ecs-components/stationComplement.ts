import { stationSchema } from "@thorium/ecs-components/stationComplementSchema";
import z from "zod";

export const stationComplement = z
	.object({
		name: z.string().default("Station Complement"),
		stations: z.array(stationSchema).default([]),
	})
	.default({});
