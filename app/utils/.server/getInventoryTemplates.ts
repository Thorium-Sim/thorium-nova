import type { DataContext } from "@thorium/.server/DataContext";
import { FilterInventorySystem } from "@thorium/.server/systems/FilterInventorySystem";
import type { ECS } from "@thorium/utils/ecs";

export function getInventoryTemplates(ecs?: ECS | null) {
	for (const system of ecs?.systems || []) {
		if (
			system.constructor.name === "FilterInventorySystem" &&
			system instanceof FilterInventorySystem
		) {
			return system.getInventoryTemplates();
		}
	}

	return {};
}

export function getPluginInventoryTemplates(ctx: DataContext) {
	return ctx.server.plugins.flatMap((plugin) => {
		return plugin.aspects.inventory.map((inventory) => inventory.name);
	});
}
