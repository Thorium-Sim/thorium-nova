import { nodeFlagsSchema } from "@thorium/utils/flags/DeckNode";
import z from "zod";

export const isRoom = z
	.object({
		flags: nodeFlagsSchema.array().default([]),
	})
	.default({});
