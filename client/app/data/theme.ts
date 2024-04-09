import type ThemePlugin from "@server/classes/Plugins/Theme";
import { t } from "@server/init/t";

export const theme = t.router({
	get: t.procedure
		.filter((publish: { clientId: string } | null, { ctx }) => {
			if (publish && publish.clientId !== ctx.id) return false;
			return true;
		})
		.request(({ ctx }) => {
			const themeObj = ctx.server.plugins
				.filter((plugin) => ctx.flight?.pluginIds.includes(plugin.id))
				.reduce((acc: null | ThemePlugin, plugin) => {
					if (acc) return acc;
					if (plugin.id !== ctx.ship?.components.theme?.pluginId) return acc;
					return (
						plugin.aspects.themes.find(
							(t) => t.name === ctx.ship?.components.theme?.themeId,
						) || null
					);
				}, null);
			return themeObj;
		}),
});
