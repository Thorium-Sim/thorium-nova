import { t } from "@thorium/.server/init/t";

export const server = t.router({
	snapshot: t.procedure.send(({ ctx }) => {
		const server = ctx.server;
		server.write(true);
		server.plugins.forEach((plugin) => {
			plugin.write(true);
		});
		const flight = ctx.flight;
		flight?.write(true);
	}),
	restoreDefaultPlugin: t.procedure.send(async () => {
		throw new Error(
			"Not implemented. Manually download the plugin from https://github.com/Thorium-Sim/thorium-nova-plugin",
		);
		// await ctx.server.restoreDefaultPlugin();
	}),
});
