import z from "zod";

/** This is a legacy system */
export const isNavigation = z
	.object({
		/** Whether the course is calculated on the navigation card or given from sensors. Removes the course calculation ability. */
		calculate: z.boolean().default(true),
		currentCourse: z
			.object({
				x: z.string().default(""),
				y: z.string().default(""),
				z: z.string().default(""),
			})
			.default({}),
		calculatedCourse: z
			.object({
				x: z.string().default(""),
				y: z.string().default(""),
				z: z.string().default(""),
			})
			.default({}),
		destination: z.string().nullable().default(null),
		destinations: z.string().array().default([]),
		scanning: z.boolean().default(false),
		presets: z
			.object({
				name: z.string(),
				course: z.object({
					x: z.string(),
					y: z.string(),
					z: z.string(),
				}),
			})
			.array()
			.default([]),
		/** Whether the calculated course is given as thruster adjustments. Removes the course entering ability. */
		thrusters: z.boolean().default(false),
	})
	.default({});
