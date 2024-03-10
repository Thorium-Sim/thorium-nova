import z from "zod";

/**
 * Represents positions in interstellar and solar space,
 * as well as the position of entities within a ship.
 *
 * Using a single position component makes it easier to send
 * high-frequency updates with snapshot interpolation.
 *
 * Interstellar: LightMinute
 * Solar: Kilometer
 * Ship: Meter
 */
export const position = z
	.object({
		/** If the type is solar, the ID of the solar system entity; if ship, the ID of the ship entity */
		parentId: z.number().nullable().default(null),
		type: z.enum(["interstellar", "solar", "ship"]).default("interstellar"),
		x: z.number().default(0),
		y: z.number().default(0),
		/**
		 * For ship maps, the Z coordinate is used to represent which deck the crew member is on.
		 * Z is the index of the deck number. Decimal values are used when traveling between decks.
		 * The deck that the crew member is on is found by rounding the Z coordinate.
		 */
		z: z.number().default(0),
	})
	.default({});
