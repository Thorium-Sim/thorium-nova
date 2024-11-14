import { pubsub } from "@server/init/pubsub";
import type { Entity } from "@server/utils/ecs";
import uniqid from "@thorium/uniqid";

/** Play a sound effect originating from a ship */
export function playShipSound(
	entity: Entity,
	ship: Entity,
	soundKey: string,
	distance?: number,
) {
	if (!entity.components.soundEffects?.soundBank[soundKey]) return;

	const range =
		ship?.components.position && distance
			? { distance, position: ship.components.position }
			: undefined;

	const stations = ship?.id ? [{ shipId: ship.id }] : undefined;

	// Play the sound
	const sound = {
		sounds: entity.components.soundEffects.soundBank[soundKey],
		range,
		stations,
		key: soundKey,
		id: uniqid("snd_"),
	};
	pubsub.publish.effects.sounds({
		type: "sound",
		entityId: entity.id,
		sound,
	});

	if (sound.sounds.some((sound) => sound.loop)) {
		entity.components.soundEffects.looping
			.filter((s) => s.key === soundKey)
			.forEach((s) => {
				pubsub.publish.effects.sounds({
					type: "cancelLooping",
					entityId: entity.id,
					soundId: s.id,
				});
			});

		const newLooping = entity.components.soundEffects.looping
			.filter((s) => s.key !== soundKey)
			.concat(sound);
		entity.updateComponent("soundEffects", {
			looping: newLooping,
		});
	}

	return sound;
}

export function cancelLoopingSound(entity: Entity, soundKey: string) {
	entity.components.soundEffects?.looping
		.filter((s) => s.key === soundKey)
		.forEach((s) => {
			pubsub.publish.effects.sounds({
				type: "cancelLooping",
				entityId: entity.id,
				soundId: s.id,
			});
		});
}
