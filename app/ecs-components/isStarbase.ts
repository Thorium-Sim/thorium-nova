import z from "zod";

export const isStarbase = z
	.object({
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
