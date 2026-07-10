import TextPatternPlugin from "@thorium/.server/classes/Plugins/TextPattern";
import { pubsub } from "@thorium/.server/init/pubsub";
import { t } from "@thorium/.server/init/t";
import inputAuth from "@thorium/utils/.server/inputAuth";
import z from "zod";

import { getPlugin } from "./utils";

export const textPattern = t.router({
	all: t.procedure
		.input(z.object({ pluginId: z.string() }))
		.filter((publish: { pluginId: string } | null, { input }) => {
			if (!input) return false;
			if (publish && input.pluginId !== publish.pluginId) return false;
			return true;
		})
		.request(({ ctx, input }) => {
			const plugin = getPlugin(ctx, input.pluginId);
			return plugin.aspects.textPatterns;
		}),
	get: t.procedure
		.input(z.object({ pluginId: z.string(), textPatternId: z.string() }))
		.filter((publish: { pluginId: string; textPatternId: string } | null, { input }) => {
			if (
				publish &&
				(input.pluginId !== publish.pluginId || input.textPatternId !== publish.textPatternId)
			)
				return false;
			return true;
		})
		.request(async ({ ctx, input }) => {
			const plugin = getPlugin(ctx, input.pluginId);
			const textPattern = plugin.aspects.textPatterns.find(
				(textPattern) => textPattern.name === input.textPatternId,
			);
			if (!textPattern) throw new Error("Text Pattern not found");
			return textPattern;
		}),
	create: t.procedure
		.input(z.object({ pluginId: z.string(), name: z.string() }))
		.send(async ({ ctx, input }) => {
			inputAuth(ctx);
			const plugin = getPlugin(ctx, input.pluginId);
			const textPattern = await TextPatternPlugin.create({ name: input.name }, plugin);
			plugin.aspects.textPatterns.push(textPattern);

			pubsub.publish.plugin.textPattern.all({ pluginId: input.pluginId });
			return { textPatternId: textPattern.name };
		}),
	delete: t.procedure
		.input(z.object({ pluginId: z.string(), textPatternId: z.string() }))
		.send(async ({ ctx, input }) => {
			inputAuth(ctx);
			const plugin = getPlugin(ctx, input.pluginId);
			const textPattern = plugin.aspects.textPatterns.find(
				(textPattern) => textPattern.name === input.textPatternId,
			);
			if (!textPattern) throw new Error("Text Pattern not found.");
			plugin.aspects.textPatterns.splice(plugin.aspects.textPatterns.indexOf(textPattern), 1);

			pubsub.publish.plugin.textPattern.all({ pluginId: input.pluginId });

			await textPattern?.remove();
		}),
	update: t.procedure
		.input(
			z.intersection(
				z.object({ pluginId: z.string(), textPatternId: z.string() }),
				z.union([
					z.object({ name: z.string() }),
					z.object({ description: z.string() }),
					z.object({ textPattern: z.string() }),
					z.object({ category: z.string() }),
				]),
			),
		)
		.send(async ({ ctx, input }) => {
			inputAuth(ctx);
			const plugin = getPlugin(ctx, input.pluginId);
			const textPattern = plugin.aspects.textPatterns.find(
				(textPattern) => textPattern.name === input.textPatternId,
			);
			if (!textPattern) throw new Error("Text Pattern not found.");
			if ("name" in input) {
				await textPattern.rename(input.name);
			}
			if ("description" in input) {
				textPattern.description = input.description;
			}
			if ("category" in input) {
				textPattern.category = input.category;
			}
			if ("textPattern" in input) {
				textPattern.textPattern = input.textPattern;
				pubsub.publish.textPattern.evaluate(input);
			}
			pubsub.publish.plugin.textPattern.all({ pluginId: input.pluginId });
			pubsub.publish.plugin.textPattern.get({
				pluginId: input.pluginId,
				textPatternId: textPattern.name,
			});
			return {
				textPatternId: textPattern.name,
			};
		}),
	duplicate: t.procedure
		.input(z.object({ pluginId: z.string(), textPatternid: z.string(), name: z.string() }))
		.send(async ({ ctx, input }) => {
			inputAuth(ctx);
			const plugin = getPlugin(ctx, input.pluginId);
			const textPattern = plugin.aspects.textPatterns.find(
				(textPattern) => textPattern.name === input.textPatternid,
			);
			if (!textPattern) throw new Error("Text Pattern not found.");
			const textPatternCopy = await textPattern.duplicate(input.name);
			pubsub.publish.plugin.textPattern.all({ pluginId: input.pluginId });
			return { textPatternId: textPatternCopy.name };
		}),
});
