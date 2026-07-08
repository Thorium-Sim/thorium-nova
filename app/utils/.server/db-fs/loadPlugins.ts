import path from "path";

import BasePlugin from "@thorium/.server/classes/Plugins";
import type { ServerDataModel } from "@thorium/.server/classes/ServerDataModel";
import { thoriumContext } from "@thorium/utils/.server/context";

export async function loadPlugins(this: ServerDataModel) {
	const thoriumPath = thoriumContext.getStore()!.thoriumPath;
	const plugins = new Bun.Glob(path.join(thoriumPath, "/plugins/*/manifest.yml")).scan({
		onlyFiles: true,
	});
	await Promise.all(
		(await Array.fromAsync(plugins)).map(async (plugin) => {
			const splitPath = plugin.split(path.sep);
			if (splitPath.at(-1) === "manifest.yml") {
				const name = splitPath.at(-2);
				try {
					const plugin = new BasePlugin({ name }, this, {
						meta: { filePath: `/plugins/${name}/manifest.yml` },
					});
					await plugin.loadAspects();
					this.plugins.push(plugin);
				} catch (err) {
					console.error(`Error loading plugin ${name}:`, err);
				}
			}
		}),
	);
}
