import { FilterInventorySystem } from "@server/systems/FilterInventorySystem";
import type { ECS } from "./ecs";
import type { DataContext } from "./types";

export function getInventoryTemplates(ecs?: ECS | null) {
	const inventorySystem = ecs?.systems.find(
		(sys) => sys.constructor.name === "FilterInventorySystem",
	);
	if (inventorySystem instanceof FilterInventorySystem)
		return inventorySystem.getInventoryTemplates();

	return {};
}

export function getPluginInventoryTemplates(ctx: DataContext) {
	return ctx.server.plugins.flatMap((plugin) => {
		return plugin.aspects.inventory.map((inventory) => inventory.name);
	});
}
