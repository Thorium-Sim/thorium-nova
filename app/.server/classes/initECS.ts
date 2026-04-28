import systems from "@thorium/.server/systems";
import { type ECS, Entity } from "@thorium/utils/ecs";
import { DefaultUIDGenerator } from "@thorium/utils/ecs/uid";

export function initECS(ecs: ECS, entities: Entity[], mode: "nova" | "legacy") {
	for (const Sys of systems) {
		if (Sys.flightMode?.includes(mode)) {
			ecs.addSystem(new Sys());
		}
	}
	// We need to selectively add certain entities first
	entities.forEach(({ id, components }) => {
		if (components.isSolarSystem) {
			const e = new Entity(id, components);
			ecs.addEntity(e);
		}
	});
	entities.forEach(({ id, components }) => {
		if (components.isSolarSystem) return;
		const e = new Entity(id, components);
		ecs.addEntity(e);
	});
	const maxId = entities.reduce((acc, { id }) => Math.max(acc, id), DefaultUIDGenerator.uid);
	DefaultUIDGenerator.uid = maxId + 1;
}
