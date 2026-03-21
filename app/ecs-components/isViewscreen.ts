import z from "zod";

export const isViewscreen = z
	.object({
		shipId: z.number().default(0),
		viewscreenId: z.string().default(""),
		name: z.string().default("Viewscreen"),
		tags: z.array(z.string()).default([]),
		isMainViewscreen: z.boolean().default(false),
		cameraYaw: z.number().default(0),
		cameraPitch: z.number().default(0),
		/** Camera field of view in degrees (10–80). */
		cameraFov: z.number().min(10).max(80).default(45),
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
		/**
		 * Set by the damage system when this viewscreen's damage component goes offline.
		 * What actually breaks depends on brokenMode:
		 * - fullyBroken: cameras + gizmos go down
		 * - cameraBrokenOnly: only cameras go down, gizmos still work
		 * - invincible: this flag is never set (damage component is invulnerable)
		 */
		damageBroken: z.boolean().default(false),
	})
	.default({});
