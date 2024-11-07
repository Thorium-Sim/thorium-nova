import { type Entity, System } from "@server/utils/ecs";

export class SoundEffectsSystem extends System {
	test(entity: Entity) {
		return !!entity.components.soundEffect;
	}
}
