import z from "zod";

/**
 * Use for docking and other rigid 0dof situations.
 * By convention, entity A is the host ship for docking.
 */
export const fixedConstraint = z
	.object({
		idA: z.number().default(-1),
		anchorA: z.tuple([z.number(), z.number(), z.number()]).default([0, 0, 0]),
		frameA: z.tuple([z.number(), z.number(), z.number()]).default([0, 0, 0]),

		idB: z.number().default(-1),
		anchorB: z.tuple([z.number(), z.number(), z.number()]).default([0, 0, 0]),
		frameB: z.tuple([z.number(), z.number(), z.number()]).default([0, 0, 0]),

		/**
		 * The various handles for this joint across physics worlds. The key is the world's entity id, the value is the handle.
		 */
		handles: z.any(),
	})
	.default({});

/** Use for tractor beams, where the target is pulled towards a rest length */
export const springConstraint = z.object({}).default({});
