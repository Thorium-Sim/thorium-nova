import z from "zod";

export const isShip = z
	.object({
		/**
		 * The class of the ship. This only applies to spawned ships.
		 */
		shipClass: z.string().default("Astra Battleship"),
		/**
		 * The registry number of the ship. For spawned ships, it is the fully generated number, based on a hash of the ship's name.
		 */
		registry: z.string().default("NCC-1993"),
		/**
		 * The category of the ship, eg. station, fighter, shuttle, cruiser, carrier, etc.
		 */
		category: z.string().default("Cruiser"),
		/**
		 * The current alert level of the ship. On a scale from 5 being "all clear" and 1 being "red alert".
		 * p represents a cloaked status.
		 */
		alertLevel: z
			.union([
				z.literal("5"),
				z.literal("4"),
				z.literal("3"),
				z.literal("2"),
				z.literal("1"),
				z.literal("p"),
			])
			.default("5"),
		assets: z
			.object({
				/**
				 * The path to the logo image. Best if it's a square image. SVGs are preferred.
				 */
				logo: z.string().optional(),
				/**
				 * The path to the 3D model. Must be in GLB or GLTF format. See the docs for instructions on how to position your model.
				 */
				model: z.string().optional(),
				/**
				 * The vanity (pretty) view of the ship as a PNG. Usually auto-generated from the model.
				 */
				vanity: z.string().optional(),
				/**
				 * The top view of the ship as a PNG. Usually auto-generated from the model.
				 */
				topView: z.string().optional(),
				/**
				 * The side view of the ship as a PNG. Usually auto-generated from the model.
				 */
				sideView: z.string().optional(),
			})
			.default({}),
	})
	.default({});
