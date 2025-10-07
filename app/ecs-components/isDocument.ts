import { z } from "zod";
export const isDocument = z
	.object({
		shipId: z.number().default(-1),
		// Supports PDFs, images, videos, and audio
		filePath: z.string().default(""),
		/**
		 * Lots of nested arrays here.
		 * The inner tuple is x,y,pressure
		 * An array of those makes a path
		 * An array of those makes all the annotations on a page
		 * The final array is of which page the annotation is on
		 * Images only have one page, pages pretty much only apply to PDFs
		 */
		annotations: z
			.array(z.array(z.tuple([z.number(), z.number(), z.number()])))
			.array()
			.default([]),
	})
	.default({});
