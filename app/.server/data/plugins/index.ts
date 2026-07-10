import path from "node:path";

import BasePlugin from "@thorium/.server/classes/Plugins";
import { macro } from "@thorium/.server/data/plugins/macro";
import { textPattern } from "@thorium/.server/data/plugins/textPattern";
import { pubsub } from "@thorium/.server/init/pubsub";
import { t } from "@thorium/.server/init/t";
import inputAuth from "@thorium/utils/.server/inputAuth";
import z from "zod";

import { inventory } from "./inventory";
import { ship } from "./ship";
import { starmap } from "./starmap";
import { systems } from "./systems";
import { theme } from "./themes";
import { timeline } from "./timeline";
import { getPlugin } from "./utils";

export function publish(pluginId: string) {
	pubsub.publish.plugin.all();
	pubsub.publish.plugin.get({ pluginId });
}

export const plugin = t.router({
	ship,
	timeline,
	macro,
	theme,
	systems,
	starmap,
	inventory,
	textPattern,
	all: t.procedure.request(({ ctx }) => {
		return ctx.server.plugins;
	}),
	get: t.procedure
		.input(z.object({ pluginId: z.string().catch("") }))
		.filter((publish: { pluginId: string } | null, { input }) => {
			if (publish && input.pluginId !== publish.pluginId) return false;
			return true;
		})
		.request(({ ctx, input }) => {
			const plugin = ctx.server.plugins.find((plugin) => plugin.id === input.pluginId);
			return plugin ? { ...plugin, coverImage: plugin.coverImage } : null;
		}),
	create: t.procedure.input(z.object({ name: z.string() })).send(async ({ ctx, input }) => {
		inputAuth(ctx);
		const plugin = new BasePlugin(input, ctx.server, {
			meta: { filePath: `/plugins/${input.name}/manifest.yml` },
		});
		await plugin.loadAspects();
		ctx.server.plugins.push(plugin);
		publish(plugin.id);
		return { pluginId: plugin.id };
	}),
	delete: t.procedure.input(z.object({ pluginId: z.string() })).send(async ({ ctx, input }) => {
		inputAuth(ctx);
		const plugin = getPlugin(ctx, input.pluginId);
		await plugin.remove();
		ctx.server.plugins.splice(ctx.server.plugins.indexOf(plugin), 1);
		publish(plugin.id);
	}),
	duplicate: t.procedure
		.input(z.object({ pluginId: z.string(), name: z.string() }))
		.send(async ({ ctx, input }) => {
			inputAuth(ctx);
			const plugin = getPlugin(ctx, input.pluginId);

			const pluginCopy = plugin.duplicate(input.name);
			ctx.server.plugins.push(pluginCopy);
			publish(plugin.id);
			return { pluginId: pluginCopy.id };
		}),
	update: t.procedure
		.input(
			z.object({
				pluginId: z.string(),
				name: z.string().optional(),
				description: z.string().optional(),
				tags: z.string().array().optional(),
				coverImage: z.instanceof(File).optional(),
				active: z.boolean().optional(),
			}),
		)
		.send(async ({ ctx, input }) => {
			inputAuth(ctx);
			const plugin = getPlugin(ctx, input.pluginId);
			if (input.description) {
				plugin.description = input.description;
			}

			if (input.tags) {
				plugin.tags = input.tags;
			}
			if (input.coverImage) {
				const ext = path.extname(input.coverImage.name);
				plugin.coverImage = await ctx.uploadFile.call(plugin, input.coverImage, `coverImage${ext}`);
			}
			if (input.active !== undefined) {
				plugin.active = input.active;
			}
			if (input.name) {
				await plugin.rename(input.name);
			}
			publish(plugin.id);
			return { pluginId: plugin.id };
		}),
});
