import { audioContext } from "./audioContext";
import { downMixBuffer } from "./downmixBuffer";
import { createRNG, type RNG } from "@thorium/utils/rng";
import type { Sound as SoundComponent } from "@thorium/ecs-components/sound";
import { AudioLoopWithGap } from "./AudioLoopWithGap";
import { clientId, q } from "@thorium/context/AppContext";
import { useLiveQuery } from "@thorium/utils/live-query/client";
import { useAudioSettingsStore } from "./audioSettingsStore";
import { useStation } from "@thorium/routes/station/useStation";

export type SoundType =
	| "ambiance"
	| "soundEffect"
	| "ui"
	| "music"
	| "dialogue";

const GainNode =
	typeof window === "undefined"
		? (class {
				connect = () => {};
				gain = { setValueAtTime: () => {} };
			} as any)
		: window.GainNode;

const volume = useAudioSettingsStore.getState();
const mainGainNode = new GainNode(audioContext, { gain: volume.mainVolume });
const gainNodes = {
	ambiance: new GainNode(audioContext, { gain: volume.ambianceVolume }),
	soundEffect: new GainNode(audioContext, { gain: volume.soundEffectVolume }),
	ui: new GainNode(audioContext, { gain: volume.uiVolume }),
	music: new GainNode(audioContext, { gain: volume.musicVolume }),
	dialogue: new GainNode(audioContext, { gain: volume.dialogueVolume }),
};

if (typeof window !== "undefined") {
	mainGainNode.connect(audioContext.destination);
	for (const node in gainNodes) {
		// @ts-expect-error
		gainNodes[node].connect(mainGainNode);
	}
}

useAudioSettingsStore.subscribe(
	({
		mainVolume,
		ambianceVolume,
		musicVolume,
		soundEffectVolume,
		uiVolume,
	}) => {
		mainGainNode.gain.setValueAtTime(mainVolume, audioContext.currentTime);
		gainNodes.ambiance.gain.setValueAtTime(
			ambianceVolume,
			audioContext.currentTime,
		);
		gainNodes.music.gain.setValueAtTime(musicVolume, audioContext.currentTime);
		gainNodes.soundEffect.gain.setValueAtTime(
			soundEffectVolume,
			audioContext.currentTime,
		);
		gainNodes.ui.gain.setValueAtTime(uiVolume, audioContext.currentTime);
		gainNodes.dialogue.gain.setValueAtTime(uiVolume, audioContext.currentTime);
	},
);

interface Sound {
	id: string;
	url: string;
	volume: number;
	playbackRate: number;
	paused?: boolean;
	type: SoundType;
	channel: number[] | null;
	source?: AudioLoopWithGap | AudioBufferSourceNode;
	gain?: GainNode;
	onFinishedPlaying?: () => void;
}

const sounds = new Map<string, Sound>();
const playingSounds = new Set<string>();

function randomFromRange(rng: RNG, range: [number, number]) {
	return Math.abs(rng.next()) * 2 * (range[1] - range[0]) + range[0];
}

export function soundIsPlaying(id: string) {
	return sounds.has(id) || playingSounds.has(id);
}

// Playback rate and volume will change over 2 seconds so it isn't too dramatic.
const PLAYBACK_UPDATE_DURATION = 2;
const VOLUME_UPDATE_DURATION = 2;
export function updateSound(
	id: string,
	{ playbackRate, volume }: { playbackRate?: number; volume?: number },
) {
	const sound = sounds.get(id);
	if (!sound || !sound.source) return false;
	if (playbackRate) {
		if (sound.source instanceof AudioLoopWithGap) {
			sound.source.playbackRate = playbackRate;
			sound.source.source?.playbackRate.linearRampToValueAtTime(
				playbackRate,
				audioContext.currentTime + PLAYBACK_UPDATE_DURATION,
			);
		} else {
			sound.playbackRate = playbackRate;
			sound.source.playbackRate.linearRampToValueAtTime(
				playbackRate,
				audioContext.currentTime + PLAYBACK_UPDATE_DURATION,
			);
		}
	}
	if (typeof volume === "number") {
		sound.volume = volume;
		if (sound.gain) {
			sound.gain.gain.setValueAtTime(
				sound.gain.gain.value,
				audioContext.currentTime,
			);

			sound.gain.gain.linearRampToValueAtTime(
				Math.max(volume * volume, Number.EPSILON),
				audioContext.currentTime + VOLUME_UPDATE_DURATION,
			);
		}
	}

	return true;
}

export async function playSound(
	opts: SoundComponent & { id: string; type: SoundType },
	onFinishedPlaying?: () => void,
) {
	removeSound(opts.id, true);
	playingSounds.add(opts.id);
	const rng = createRNG(opts.id.toString());
	const volume = randomFromRange(rng, opts.volume);
	const playbackRate = randomFromRange(rng, opts.playbackRate);
	const channel = opts.channel ?? [0, 1];
	const response = await fetch(opts.url);
	if (!response.ok) return;
	const arrayBuffer = await response.arrayBuffer();
	if (!arrayBuffer) return;

	if (!audioContext) return;

	if (opts.delay) {
		await new Promise((res) => setTimeout(res, opts.delay * 1000));
		if (!playingSounds.has(opts.id)) return;
	}
	// If the sound was removed before the delay is over, don't play it.

	audioContext.destination.channelCount =
		audioContext.destination.maxChannelCount;
	// Connect the sound source to the volume control.
	// Create a buffer from the response ArrayBuffer.
	let buffer = await new Promise<AudioBuffer>((resolve, reject) =>
		audioContext.decodeAudioData(arrayBuffer, resolve, reject),
	);
	if (opts.channel) {
		buffer = downMixBuffer(buffer, channel);
	}
	const sound: Sound = {
		id: opts.id,
		url: opts.url,
		volume,
		playbackRate,
		channel,
		onFinishedPlaying,
		type: opts.type,
	};
	// Create a new buffer and set it to the specified channel.
	// Ambiance doesn't need gaps, but also needs to work correctly
	// with changing volumes and playback rates over time,
	// so ambiance uses a default audio buffer
	if (opts.type === "ambiance") {
		sound.source = audioContext.createBufferSource();
		sound.source.buffer = buffer;
		sound.source.loop = opts.loop;
		sound.source.loopStart = opts.loopStart || 0;
		sound.source.loopEnd = buffer.duration * (opts.loopEnd ?? 1);
		sound.source.playbackRate.setValueAtTime(playbackRate, 0);
	} else {
		sound.source = new AudioLoopWithGap(audioContext, buffer, {
			loop: opts.loop,
			loopStart: opts.loopStart || 0,
			loopEnd: buffer.duration * (opts.loopEnd ?? 1),
			loopGap: opts.loopGap || 0,
			playbackRate,
		});
	}

	sound.gain = audioContext.createGain();
	// Use an x * x curve, since linear isn't super great with volume.
	sound.gain.gain.setValueAtTime(volume * volume, 0);
	sound.source.connect(sound.gain);
	sound.source.onended = () => {
		if (sound.source?.loop) return;
		removeSound(opts.id);
		onFinishedPlaying?.();
	};
	sound.gain.connect(gainNodes[sound.type]);
	sound.source.start();
	sounds.set(opts.id, sound);
}

const fadeOutTime = 0.03;
export function removeSound(id: string, force?: boolean) {
	const sound = sounds.get(id);
	playingSounds.delete(id);
	if (sound?.source) {
		if (force) {
			// Setting the value immediately before ramping the value helps avoid popping.
			sound.gain?.gain.setValueAtTime(
				sound.gain.gain.value,
				audioContext.currentTime,
			);
			sound.gain?.gain.linearRampToValueAtTime(
				0.001,
				audioContext.currentTime + fadeOutTime,
			);

			setTimeout(() => {
				sound.source?.stop();
				sounds.delete(id);
			}, fadeOutTime * 1000);
		} else {
			sound.source.loop = false;
		}
	} else {
		sounds.delete(id);
		playingSounds.delete(id);
		sound?.onFinishedPlaying?.();
	}
}

export function removeAllSounds(types?: SoundType[]) {
	for (const id of sounds.keys()) {
		const sound = sounds.get(id);
		if (!sound) return;
		if (types && !types.includes(sound.type)) return;
		removeSound(id, true);
	}
}

export function stopAllLooping(types?: SoundType[]) {
	for (const id of sounds.keys()) {
		const sound = sounds.get(id);
		if (sound?.source) {
			if (types && !types.includes(sound.type)) return;
			sound.source.loop = false;
		}
		sounds.delete(id);
		playingSounds.delete(id);
	}
}

export function stopLooping(id: string) {
	const sound = sounds.get(id);
	if (sound?.source) {
		sound.source.loop = false;
	}
	sounds.delete(id);
	playingSounds.delete(id);
}

export function SoundPlayer() {
	const { shipId } = useStation();
	const { interpolate } = useLiveQuery();

	q.effects.sounds.useNetSubscribe({ clientId }, (data) => {
		if (!data) return;
		switch (data.type) {
			case "sound": {
				const shipPosition = interpolate(shipId);
				const { sounds, range } = data.sound;
				// Calculate a volume multiplier based on the distance from the sound source.
				const volumeMultiplier =
					range && shipPosition
						? Math.max(
								0,
								1 -
									(Math.hypot(
										range.position.x - shipPosition.x,
										range.position.y - shipPosition.y,
										range.position.z - shipPosition.z,
									) /
										range.distance) *
										1.1,
							)
						: 1;

				if (volumeMultiplier <= 0) return;

				sounds.forEach((sound) => {
					playSound({
						...sound,
						type: "soundEffect",
						id: data.sound.id,
						volume: [
							sound.volume[0] * volumeMultiplier,
							sound.volume[1] * volumeMultiplier,
						],
					});
				});

				break;
			}
			case "cancelLooping":
				stopLooping(data.soundId);
				break;
			case "stop":
				removeSound(data.soundId);
				break;
			case "stopAll":
				removeAllSounds();
				break;
		}
	});

	return null;
}
