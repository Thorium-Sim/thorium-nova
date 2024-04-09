import z from "zod";
import { nodeFlagsSchema } from "server/src/classes/Plugins/Ship/Deck";

export const isRoom = z
	.object({
		flags: nodeFlagsSchema.array().default([]),
	})
	.default({});
