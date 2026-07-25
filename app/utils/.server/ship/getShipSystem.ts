import type { ShipSystemTypes } from "@thorium/ecs-components/shipSystems";
import type { ECS, Entity } from "@thorium/utils/ecs";
import { pascalCase } from "change-case";

export function getShipSystem<T extends boolean>(
	ecs: ECS,
	param: { systemType: ShipSystemTypes; shipId: number } | { systemId: number },
	safe?: T,
): T extends true ? Entity | undefined : Entity {
	let system: Entity | undefined | null;
	if ("systemId" in param && param.systemId) {
		system = ecs.getEntityById(param.systemId);
	} else if ("systemType" in param) {
		if (ecs.shipSystemCache.has(param.shipId)) {
			const shipEntry = ecs.shipSystemCache.get(param.shipId)!;
			if (shipEntry.has(param.systemType)) {
				const cacheEntry = shipEntry.get(param.systemType);
				if (Array.isArray(cacheEntry)) return cacheEntry[0];
				return cacheEntry!;
			}
		} else {
			ecs.shipSystemCache.set(param.shipId, new Map());
		}
		for (const [id] of ecs.getEntityById(param.shipId)?.components.shipSystems?.shipSystems || []) {
			const entity = ecs.getEntityById(id);
			if (entity?.components && `is${pascalCase(param.systemType)}` in entity.components) {
				system = entity;
				break;
			}
		}
		if (system) {
			ecs.shipSystemCache.get(param.shipId)!.set(param.systemType, system);
		}
	}
	if (!safe) {
		if (!system) throw new Error(`System ${JSON.stringify(param)} not found.`);
	}
	return system!;
}

export function getShipSystems(ecs: ECS, param: { systemType: string; shipId: number }) {
	if (ecs.shipSystemCache.has(param.shipId)) {
		const shipEntry = ecs.shipSystemCache.get(param.shipId)!;
		if (shipEntry.has(param.systemType)) {
			const cacheEntry = shipEntry.get(param.systemType);
			if (Array.isArray(cacheEntry)) return cacheEntry;
			return [cacheEntry];
		}
	} else {
		ecs.shipSystemCache.set(param.shipId, new Map());
	}
	const systems: Entity[] = [];
	const ship = ecs.getEntityById(param.shipId);
	for (const [id] of ship?.components.shipSystems?.shipSystems || []) {
		const entity = ecs.getEntityById(id);
		if (entity?.components && `is${pascalCase(param.systemType)}` in entity.components) {
			systems.push(entity);
		}
	}
	ecs.shipSystemCache.get(param.shipId)!.set(param.systemType, systems);

	return systems;
}
