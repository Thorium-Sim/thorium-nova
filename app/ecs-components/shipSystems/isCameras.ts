import { z } from "zod";

export const isCameras = z
	.object({
		fov: z.number().default(45),
	})
	.default({});
