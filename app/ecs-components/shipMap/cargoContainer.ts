import z from "zod";

/** Used for the literal cargo containers that move around the ship */
export const isCargoContainer = z.object({}).default({});

/** Used for anything that can carry cargo */
export const cargoContainer = z
	.object({
		/** How much cargo this entity can hold. Measured in liters. */
		volume: z.number().default(1000),
		/** The contents of this cargo container. The key is the name/ID of inventory template object stored on the flight. */
		contents: z
			.record(
				z.object({
					count: z.number(),
					// Measured in Kelvin
					temperature: z.number(),
				}),
			)
			.default({}),
	})
	.default({});
