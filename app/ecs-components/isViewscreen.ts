import z from "zod";

export const isViewscreen = z
	.object({
		shipId: z.number().default(0),
		name: z.string().default("Viewscreen"),
		tags: z.array(z.string()).default([]),
		cameraYaw: z.number().default(0),
		cameraPitch: z.number().default(0),
		/** Camera field of view in degrees (1–179). Values >= 180 yield a black screen because tan(fov/2) is mathematically undefined at 180°. */
		cameraFov: z.number().min(1).max(179).default(45),
		showGizmos: z.boolean().default(true),
		showLayout: z.boolean().default(true),
		brokenMode: z
			.enum(["fullyBroken", "cameraBrokenOnly", "invincible"])
			.default("fullyBroken"),
		/**
		 * FD manual override — independently disables cameras regardless of brokenMode.
		 * This is NOT related to in-game damage; the Flight Director toggles this directly.
		 */
		camerasOffline: z.boolean().default(false),
		/** References the parent "Viewscreens" system entity that owns the shared damage component. */
		viewscreenSystemId: z.number().default(0),
	})
	.default({});
