import type { DataContext } from "server/src/utils/DataContext";
import type { Entity } from "server/src/utils/ecs";
import { pascalCase } from "change-case";
export function getShipSystem(
	context: DataContext,
	param: { systemType: string } | { systemId: number },
) {
	let system: Entity | undefined | null;
	if ("systemId" in param && param.systemId) {
		system = context.flight?.ecs.getEntityById(param.systemId);
	} else if ("systemType" in param) {
		const ship = context.ship;
		for (const [id] of ship?.components.shipSystems?.shipSystems || []) {
			const entity = context.flight?.ecs.getEntityById(id);
			if (
				entity?.components &&
				`is${pascalCase(param.systemType)}` in entity.components
			) {
				system = entity;
				break;
			}
		}
	}
	if (!system) throw new Error(`System ${JSON.stringify(param)} not found.`);
	return system;
}

export function getShipSystems(
	context: DataContext,
	param: { systemType: string },
) {
	const systems: Entity[] = [];
	const ship = context.ship;
	for (const [id] of ship?.components.shipSystems?.shipSystems || []) {
		const entity = context.flight?.ecs.getEntityById(id);
		if (
			entity?.components &&
			`is${pascalCase(param.systemType)}` in entity.components
		) {
			systems.push(entity);
		}
	}
	return systems;
}
