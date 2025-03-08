import ThemePlugin from "@thorium/.server/classes/Plugins/Theme";
import { t } from "@thorium/.server/init/t";
import inputAuth from "@thorium/utils/.server/inputAuth";
import { z } from "zod";
import { getPlugin } from "./utils";
import defaultCSS from "./defaultTheme";
import { pubsub } from "@thorium/.server/init/pubsub";
import path from "node:path";
import { DataStore } from "@thorium/utils/.server/db-fs";

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
			return Promise.all(
				plugin.aspects.themes.map(async (theme) => {
					const assetPath = await theme.getAssetUrl();
					const [rawCSS, processedCSS] = await Promise.all([
						ctx.readFile.call(theme, path.join(assetPath, theme.assets.rawCSS)),
						ctx.readFile.call(
							theme,
							path.join(assetPath, theme.assets.processedCSS),
						),
					]);
					return {
						...theme,
						rawCSS,
						processedCSS,
					};
				}),
			);
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
		.request(async ({ ctx, input }) => {
			const plugin = getPlugin(ctx, input.pluginId);
			const theme = plugin.aspects.themes.find(
				(theme) => theme.name === input.themeId,
			);
			if (!theme) throw new Error("Theme not found");
			const assetPath = await theme.getAssetUrl();

			const [rawCSS, processedCSS] = await Promise.all([
				ctx.readFile.call(theme, path.join(assetPath, theme.assets.rawCSS)),
				ctx.readFile.call(
					theme,
					path.join(assetPath, theme.assets.processedCSS),
				),
			]);

			return {
				...theme,
				rawCSS,
				processedCSS,
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

			const { assetUrl } = await DataStore.operations
				.getStore()!
				.processCSS.call(theme, defaultCSS);
			theme.assets.processedCSS = assetUrl;

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

			await theme?.remove();
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
				const { processedCSS: css, assetUrl } = await DataStore.operations
					.getStore()!
					.processCSS.call(theme, input.rawCSS);
				theme.assets.processedCSS = assetUrl;
				theme.assets.rawCSS = await ctx.uploadFile.call(
					theme,
					new Blob([input.rawCSS], { type: "text/css" }),
					"raw.css",
				);
				processedCSS = css;
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
				file: z.instanceof(File),
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

			theme.assets.files.push(
				await ctx.uploadFile.call(theme, input.file, input.fileName),
			);

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
