import z from "zod";

export const scanTypes = z.enum([
	"iff",
	"crew",
	"cargo",
	"shields",
	"weapons",
	"targeting",
	"damage",
]);
export const scan = z
	.object({
		/** The ID of the ship which initiated this scan */
		parentId: z.number().default(-1),
		/** What kind of scan is being performed */
		type: scanTypes.default("iff"),
		/** Scan's progress percentage */
		progress: z.number().default(1),
		/** The ID of the target */
		target: z.number().default(-1),
		/** How long in seconds before repeating the scan */
		repeatInterval: z.number().nullable().default(null),
		/** Duration in seconds since the last scan completed, used for repeating */
		intervalTime: z.number().default(0),
	})
	.default({});
