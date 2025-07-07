import type ThemePlugin from "@thorium/.server/classes/Plugins/Theme";
import { t } from "@thorium/.server/init/t";
import { z } from "zod";
export const theme = t.router({
	get: t.procedure
		.input(z.object({ clientId: z.string() }))
		.filter((publish: { clientId: string } | null, { input }) => {
			if (publish && publish.clientId !== input.clientId) return false;
			return true;
		})
		.autoPublish(["flightClient"], (entity) =>
			entity.components.flightClient
				? { clientId: entity.components.flightClient.clientId }
				: null,
		)
		.request(({ ctx, input }) => {
			const ship = ctx.ecs.getEntityById(
				ctx.getFlightClient(input.clientId)?.components.flightClient?.shipId ||
					-1,
			);
			const themeObj = ctx.server.plugins
				.filter((plugin) => ctx.flight?.pluginIds.includes(plugin.id))
				.reduce((acc: null | ThemePlugin, plugin) => {
					if (acc) return acc;
					if (plugin.id !== ship?.components.theme?.pluginId) return acc;
					return (
						plugin.aspects.themes.find(
							(t) => t.name === ship?.components.theme?.themeId,
						) || null
					);
				}, null);
			return themeObj;
		}),
});
