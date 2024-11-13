import type { ECS, Entity } from "@server/utils/ecs";

export function getSoundPosition(entity: Entity, ecs: ECS) {
	if (entity.components.position) return entity.components.position;
	// If the entity doesn't have a position, check the parent entity
	let parentId = -1;
	if (entity.components.isShipSystem) {
		parentId = entity.components.isShipSystem.shipId;
	}
	const parent = ecs.getEntityById(parentId);
	if (!parent) return null;
	return getSoundPosition(parent, ecs);
}
