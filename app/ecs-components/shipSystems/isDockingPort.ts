import { shipCategories } from "@thorium/utils/flags/shipClasses";
import z from "zod";

export const isDockingPort = z
	.object({
		/** Which categories of ships are allowed to dock with this docking port */
		incomingCategories: shipCategories.array().default([]),
		/** Whether the ship can use this docking port to dock with other ships */
		allowOutgoing: z.boolean().default(false),
		/** The orientation of the docking port relative to the ship. In other words, when docked, the orientations of each docking port will be inverse of each other. */
		orientation: z.tuple([z.number(), z.number(), z.number()]).default([0, 1, 0]),
		state: z.enum(["idle", "outgoing", "incoming"]).default("idle"),
		clamps: z.boolean().default(false),
		ramps: z.boolean().default(false),
		connectedPortId: z.number().nullable().default(null),
	})
	.default({});

/** Indicates that the ship entity is docked with another entity. Does not apply to to host entity. */
export const isDocked = z
	.object({
		/** The ID of the docking port that has done the docking. */
		dockingPortId: z.number().default(-1),
		/** The ID of the docking port on the host. */
		hostDockingPortId: z.number().default(-1),
		/** The ID of the host ship this ship is docked with */
		hostShipId: z.number().default(-1),
		/** The ID of the joint entity */
		jointId: z.number().default(-1),
	})
	.default({});
