import { getPlugin } from "@thorium/.server/data/plugins/utils";
import { t } from "@thorium/.server/init/t";
import { getPluginTextPatterns, interpolateText } from "@thorium/utils/interpolationEngine";
import { createRNG } from "@thorium/utils/rng";
import { z } from "zod";

export const textPattern = t.router({
	evaluate: t.procedure
		.input(
			z.object({
				textPatternId: z.string(),
				pluginId: z.string().optional(),
				randomSeed: z.string().optional(),
			}),
		)
		.filter((publish: { textPatternId: string; pluginId?: string } | null, { input }) => {
			if (
				publish &&
				(input.textPatternId !== publish.textPatternId ||
					(publish.pluginId && input.pluginId !== publish.pluginId))
			)
				return false;
			return true;
		})
		.autoPublish([], () => null)
		.request(({ ctx, input }) => {
			const rng = input.randomSeed
				? createRNG(input.randomSeed)
				: ctx.flight?.ecs.rng || createRNG(Math.random() * 100);

			let textPattern: string = "";
			if (input.pluginId) {
				const plugin = getPlugin(ctx, input.pluginId);
				const textPatternPlugin = plugin.aspects.textPatterns.find(
					(t) => t.name === input.textPatternId,
				);
				if (textPatternPlugin) {
					textPattern = textPatternPlugin.textPattern;
				}
			} else {
				textPattern = ctx.server.plugins
					.filter((p) => p.active)
					.sort((a, b) => (a.default ? -1 : b.default ? 1 : 0))
					.reduce((prev, next) => {
						if (prev) return prev;
						const textPatternPlugin = next.aspects.textPatterns.find(
							(t) => t.name === input.textPatternId,
						);
						if (textPatternPlugin) {
							return textPatternPlugin.textPattern;
						}
						return prev;
					}, "");
			}

			return { output: interpolateText(textPattern, {}, getPluginTextPatterns(ctx.server), rng) };
		}),
	interpolate: t.procedure
		.input(
			z.object({
				string: z.string(),
				pluginId: z.string().optional(),
				randomSeed: z.string().optional(),
			}),
		)
		.autoPublish([], () => null)
		.request(({ input, ctx }) => {
			const rng = input.randomSeed
				? createRNG(input.randomSeed)
				: ctx.flight?.ecs.rng || createRNG(Math.random() * 100);

			return { output: interpolateText(input.string, {}, getPluginTextPatterns(ctx.server), rng) };
		}),
});
