import { pubsub } from "@thorium/.server/init/pubsub";
import type { Sound } from "@thorium/ecs-components/sound";
import type { Entity } from "@thorium/utils/ecs";
import uniqid from "@thorium/utils/uniqid";

/** Play a sound effect originating from a ship */
export function playShipSound(entity: Entity, ship: Entity, soundKey: string, distance?: number) {
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

export function playServerSound(ship: Entity, sound: Sound, stations?: string[]) {
	const playStations = stations
		? stations.map((s) => ({ shipId: ship.id, station: s }))
		: [{ shipId: ship.id }];
	const soundKey = sound.url;
	// Play the sound
	const soundEffect = {
		sounds: [sound],
		stations: playStations,
		key: soundKey,
		id: uniqid("snd_"),
	};
	const looping = ship.components.soundEffects?.looping || [];

	if (sound.loop) {
		looping
			.filter((s) => s.key === soundKey)
			.forEach((s) => {
				pubsub.publish.effects.sounds({
					type: "cancelLooping",
					entityId: ship.id,
					soundId: s.id,
				});
			});
	}

	// Don't play the sound if it's a duplicate of an existing sound and is configured to cancel.
	if (
		!sound.loop ||
		!sound.cancelLoopingWhenDuplicate ||
		!looping.some((s) => s.key === soundKey)
	) {
		pubsub.publish.effects.sounds({
			type: "sound",
			entityId: ship.id,
			sound: soundEffect,
		});
		const newLooping = (looping.filter((s) => s.key !== soundKey) || []).concat(soundEffect);
		ship.updateComponent("soundEffects", {
			looping: newLooping,
		});
	}

	return soundEffect;
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
