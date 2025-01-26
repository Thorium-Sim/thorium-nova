import { sound } from "@thorium/ecs-components/sound";
import z from "zod";

export const theme = z
	.object({
		pluginId: z.string().default("Thorium Default"),
		themeId: z.string().default("Default Theme"),
		sounds: z
			.object({
				buttonClick: sound.array().default([]),
				buttonHover: sound.array().default([]),
				error: sound.array().default([]),
				notify: sound.array().default([]),
				login: sound.array().default([]),
				cardChange: sound.array().default([]),
				sliderDrag: sound.array().default([]),
				zoom: sound.array().default([]),
			})
			.default({}),
	})
	.default({});
