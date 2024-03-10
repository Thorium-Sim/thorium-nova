import { spectralTypes } from "@server/spawners/starTypes";
import z from "zod";

export const isStar = z
	.object({
		/** Measured in solar masses eg. multiples of the mass of the sun */
		solarMass: z.number().default(1),
		age: z.number().default(4_000_000_000),
		spectralType: spectralTypes.default("G"),
		/** Measured in degrees */
		hue: z.number().default(0),
		isWhite: z.boolean().default(false),
		/** Measured in solar radiuses eg. multiples of the radius of the sun */
		radius: z.number().default(1),
	})
	.default({});
