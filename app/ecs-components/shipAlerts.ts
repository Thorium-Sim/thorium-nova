import z from "zod";

/** All recognized alert type identifiers. */
export const alertTypes = z.enum(["collision"]);

/** How many seconds before a collision the warning system activates. */
export const COLLISION_WARNING_SECONDS = 20;

const baseAlert = {
	id: z.string(),
	/**
	 * Higher values take display precedence. When multiple alerts are active,
	 * only the highest-priority alert is shown on screen. If a new alert
	 * arrives with priority >= the current one, the current alert exits and
	 * the new one is displayed.
	 */
	priority: z.number(),
	message: z.string(),
	/**
	 * Client-side display duration in milliseconds.
	 * When set, the client auto-dismisses the warning UI after this time.
	 * When null, the warning displays persistently until the owning system
	 * removes the alert from the ECS component via clearShipAlert().
	 * Note: duration does NOT auto-remove the alert server-side — the
	 * owning system must still call clearShipAlert() when appropriate.
	 */
	duration: z.number().nullable().default(null),
};

const collisionAlert = z.object({
	...baseAlert,
	type: z.literal("collision"),
	objectId: z.number(),
	objectName: z.string(),
	timeToCollision: z.number(),
	baselineTimestamp: z.number(),
});

const shipAlert = z.discriminatedUnion("type", [collisionAlert]);

export type ShipAlert = z.infer<typeof shipAlert>;
export type CollisionAlert = z.infer<typeof collisionAlert>;

export const shipAlerts = z
	.object({
		alerts: z.array(shipAlert).default([]),
	})
	.default({});
