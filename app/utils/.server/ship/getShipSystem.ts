import type { ShipSystemTypes } from "@thorium/ecs-components/shipSystems";
import type { ECS, Entity } from "@thorium/utils/ecs";
import { pascalCase } from "change-case";
export function getShipSystem(
	ecs: ECS,
	param: { systemType: ShipSystemTypes; shipId: number } | { systemId: number },
) {
	let system: Entity | undefined | null;
	if ("systemId" in param && param.systemId) {
		system = ecs.getEntityById(param.systemId);
	} else if ("systemType" in param) {
		for (const [id] of ecs.getEntityById(param.shipId)?.components.shipSystems
			?.shipSystems || []) {
			const entity = ecs.getEntityById(id);
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
	ecs: ECS,
	param: { systemType: string; shipId: number },
) {
	const systems: Entity[] = [];
	const ship = ecs.getEntityById(param.shipId);
	for (const [id] of ship?.components.shipSystems?.shipSystems || []) {
		const entity = ecs.getEntityById(id);
		if (
			entity?.components &&
			`is${pascalCase(param.systemType)}` in entity.components
		) {
			systems.push(entity);
		}
	}
	return systems;
}
