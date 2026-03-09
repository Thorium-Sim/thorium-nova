import { z } from "zod";

export const isMainCamera = z
	.object({
		fov: z.number().default(45),
	})
	.default({});
