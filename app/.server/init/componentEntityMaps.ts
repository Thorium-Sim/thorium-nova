import type { ComponentIds } from "@thorium/ecs-components";
import type { Entity } from "@thorium/utils/ecs";

export const componentEntityMaps = new Map<
	ComponentIds,
	Set<{ procedure: string; entityMap: (entity: Entity) => any }>
>();
