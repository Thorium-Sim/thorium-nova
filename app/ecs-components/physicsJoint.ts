import z from "zod";

/**
 * Use for docking and other rigid 0dof situations.
 * By convention, entity A is the host ship for docking.
 */
export const fixedJoint = z
	.object({
		idA: z.number().default(-1),
		anchorA: z
			.object({ x: z.number(), y: z.number(), z: z.number() })
			.default({ x: 0, y: 0, z: 0 }),
		frameA: z
			.object({ x: z.number(), y: z.number(), z: z.number(), w: z.number() })
			.default({ x: 0, y: 0, z: 0, w: 1 }),

		idB: z.number().default(-1),
		anchorB: z
			.object({ x: z.number(), y: z.number(), z: z.number() })
			.default({ x: 0, y: 0, z: 0 }),
		frameB: z
			.object({ x: z.number(), y: z.number(), z: z.number(), w: z.number() })
			.default({ x: 0, y: 0, z: 0, w: 1 }),

		/**
		 * The various handles for this joint across physics worlds. The key is the world's entity id, the value is the handle.
		 */
		handles: z.any(),
	})
	.default({});

/** Use for tractor beams, where the target is pulled towards a rest length */
export const springJoint = z.object({}).default({});
