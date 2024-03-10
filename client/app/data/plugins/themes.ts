import ThemePlugin from "@server/classes/Plugins/Theme";
import { t } from "@server/init/t";
import inputAuth from "@server/utils/inputAuth";
import { z } from "zod";
import { getPlugin } from "./utils";
import defaultCSS from "./defaultTheme";
import { pubsub } from "@server/init/pubsub";

export const theme = t.router({
	all: t.procedure
		.input(z.object({ pluginId: z.string() }))
		.filter((publish: { pluginId: string } | null, { input }) => {
			if (!input) return false;
			if (publish && input.pluginId !== publish.pluginId) return false;
			return true;
		})
		.request(({ ctx, input }) => {
			const plugin = getPlugin(ctx, input.pluginId);
			return plugin.aspects.themes.map((theme) => ({
				...theme,
				rawCSS: theme.rawCSS,
				processedCSS: theme.processedCSS,
			}));
		}),
	get: t.procedure
		.input(z.object({ pluginId: z.string(), themeId: z.string() }))
		.filter(
			(publish: { pluginId: string; themeId: string } | null, { input }) => {
				if (
					publish &&
					(input.pluginId !== publish.pluginId ||
						input.themeId !== publish.themeId)
				)
					return false;
				return true;
			},
		)
		.request(({ ctx, input }) => {
			const plugin = getPlugin(ctx, input.pluginId);
			const theme = plugin.aspects.themes.find(
				(theme) => theme.name === input.themeId,
			);
			if (!theme) throw new Error("Theme not found");

			return {
				...theme,
				rawCSS: theme.rawCSS,
				processedCSS: theme.processedCSS,
			};
		}),
	available: t.procedure.request(({ ctx }) => {
		return ctx.server.plugins.reduce(
			(themes: { themeId: string; pluginId: string }[], plugin) => {
				return themes.concat(
					plugin.aspects.themes.map((theme) => ({
						themeId: theme.name,
						pluginId: plugin.id,
					})),
				);
			},
			[],
		);
	}),
	create: t.procedure
		.input(z.object({ pluginId: z.string(), name: z.string() }))
		.send(async ({ ctx, input }) => {
			inputAuth(ctx);
			const plugin = getPlugin(ctx, input.pluginId);
			const theme = new ThemePlugin({ name: input.name }, plugin);
			plugin.aspects.themes.push(theme);

			await theme.setCSS(defaultCSS);

			pubsub.publish.plugin.theme.all({ pluginId: input.pluginId });
			return { themeId: theme.name };
		}),
	delete: t.procedure
		.input(z.object({ pluginId: z.string(), themeId: z.string() }))
		.send(async ({ ctx, input }) => {
			inputAuth(ctx);
			const plugin = getPlugin(ctx, input.pluginId);
			const theme = plugin.aspects.themes.find(
				(theme) => theme.name === input.themeId,
			);
			if (!theme) throw new Error("Theme not found.");
			plugin.aspects.themes.splice(plugin.aspects.themes.indexOf(theme), 1);

			pubsub.publish.plugin.theme.all({ pluginId: input.pluginId });

			await theme?.removeFile();
		}),
	update: t.procedure
		.input(
			z.intersection(
				z.object({ pluginId: z.string(), themeId: z.string() }),
				z.union([
					z.object({ name: z.string() }),
					z.object({ rawCSS: z.string() }),
				]),
			),
		)
		.send(async ({ ctx, input }) => {
			inputAuth(ctx);
			const plugin = getPlugin(ctx, input.pluginId);
			const theme = plugin.aspects.themes.find(
				(theme) => theme.name === input.themeId,
			);
			if (!theme) throw new Error("Theme not found.");
			let processedCSS = "";
			if ("rawCSS" in input) {
				processedCSS = await theme.setCSS(input.rawCSS);
			}
			if ("name" in input) {
				await theme.rename(input.name);
			}
			pubsub.publish.plugin.theme.all({ pluginId: input.pluginId });
			pubsub.publish.plugin.theme.get({
				pluginId: input.pluginId,
				themeId: theme.name,
			});
			return { themeId: theme.name, processedCSS };
		}),
	duplicate: t.procedure
		.input(
			z.object({ pluginId: z.string(), themeId: z.string(), name: z.string() }),
		)
		.send(async ({ ctx, input }) => {
			inputAuth(ctx);
			const plugin = getPlugin(ctx, input.pluginId);
			const theme = plugin.aspects.themes.find(
				(theme) => theme.name === input.themeId,
			);
			if (!theme) throw new Error("Theme not found.");
			const themeCopy = await theme.duplicate(input.name);
			pubsub.publish.plugin.theme.all({ pluginId: input.pluginId });
			return { themeId: themeCopy.name };
		}),
	uploadFile: t.procedure
		.input(
			z.object({
				pluginId: z.string(),
				themeId: z.string(),
				file: z.union([z.instanceof(File), z.string()]),
				fileName: z.string(),
			}),
		)
		.send(async ({ ctx, input }) => {
			inputAuth(ctx);
			const plugin = getPlugin(ctx, input.pluginId);
			const theme = plugin.aspects.themes.find(
				(theme) => theme.name === input.themeId,
			);
			if (!theme) throw new Error("Theme not found.");
			if (typeof input.file !== "string") throw new Error("Invalid file.");
			await theme.addAsset(input.file, input.fileName);

			pubsub.publish.plugin.theme.all({ pluginId: input.pluginId });
			pubsub.publish.plugin.theme.get({
				pluginId: input.pluginId,
				themeId: theme.name,
			});
			return { themeId: theme.name };
		}),
	removeFile: t.procedure
		.input(
			z.object({
				pluginId: z.string(),
				themeId: z.string(),
				file: z.string(),
			}),
		)
		.send(async ({ ctx, input }) => {
			inputAuth(ctx);
			const plugin = getPlugin(ctx, input.pluginId);
			const theme = plugin.aspects.themes.find(
				(theme) => theme.name === input.themeId,
			);
			if (!theme) throw new Error("Theme not found.");
			if (typeof input.file !== "string") throw new Error("Invalid file.");
			await theme.removeAsset(input.file);

			pubsub.publish.plugin.theme.all({ pluginId: input.pluginId });
			pubsub.publish.plugin.theme.get({
				pluginId: input.pluginId,
				themeId: theme.name,
			});

			return { themeId: theme.name };
		}),
});
