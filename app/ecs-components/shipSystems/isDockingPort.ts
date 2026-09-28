import { shipCategories } from "@thorium/utils/flags/shipClasses";
import z from "zod";

export const isDockingPort = z
	.object({
		/** Which categories of ships are allowed to dock with this docking port */
		incomingCategories: shipCategories.array().default([]),
		/** Whether the ship can use this docking port to dock with other ships */
		allowOutgoing: z.boolean().default(false),
		/** How close the ship must be in kilometers to request docking */
		distance: z.number().default(50),
		/** The orientation of the docking port relative to the ship. In other words, when docked, the orientations of each docking port will be inverse of each other. */
		orientation: z
			.object({ x: z.number(), y: z.number(), z: z.number() })
			.default({ x: 0, y: 1, z: 0 }),
		/**
		 * idle — Nothing happening with this docking port
		 * outgoing — Using this docking port to dock with another ship
		 * incoming — Another ship is docking with this port
		 * requesting — Requesting for this docking port to dock with another ship
		 * requested — Another ship has requested to dock with this docking port
		 */
		state: z.enum(["idle", "outgoing", "incoming", "requesting", "requested"]).default("idle"),
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
