import { audioContext } from "@client/utils/sounds/audioContext";
import { downMixBuffer } from "@client/utils/sounds/downmixBuffer";
import { createRNG, type RNG } from "@thorium/rng";
import type { sound } from "@server/components/sound";
import { AudioLoopWithGap } from "@client/utils/sounds/AudioLoopWithGap";

interface Sound {
	id: number;
	url: string;
	volume: number;
	playbackRate: number;
	paused?: boolean;
	ambiance?: boolean;
	channel: number[] | null;
	source?: AudioLoopWithGap;
	gain?: GainNode;
	onFinishedPlaying?: () => void;
}

const sounds = new Map<number, Sound>();
const playingSounds = new Set<number>();

function randomFromRange(rng: RNG, range: [number, number]) {
	return Math.abs(rng.next()) * 2 * (range[1] - range[0]) + range[0];
}

export async function playSound(
	opts: Zod.infer<typeof sound> & { id: number },
	onFinishedPlaying?: () => void,
) {
	removeSound(opts.id, true);
	playingSounds.add(opts.id);
	const rng = createRNG(opts.id.toString());
	const volume = randomFromRange(rng, opts.volume);
	const playbackRate = randomFromRange(rng, opts.playbackRate);
	const channel = opts.channel ?? [0, 1];
	try {
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
		};
		//Create a new buffer and set it to the specified channel.
		sound.source = new AudioLoopWithGap(audioContext, buffer, {
			loop: opts.loop,
			loopStart: opts.loopStart || 0,
			loopEnd: buffer.duration * (opts.loopEnd ?? 1),
			loopGap: opts.loopGap || 0,
			playbackRate,
		});

		sound.gain = audioContext.createGain();
		// Use an x * x curve, since linear isn't super great with volume.
		sound.gain.gain.setValueAtTime(volume * volume, 0);

		sound.source.connect(sound.gain);

		sound.source.onended = () => {
			console.log("ended", sound.source?.loop);
			if (sound.source?.loop) return;
			removeSound(opts.id);
			onFinishedPlaying?.();
		};
		sound.gain.connect(audioContext.destination);
		sound.source.start();
		sounds.set(opts.id, sound);
	} catch (err) {
		console.error("There was an error");
	}
}

const fadeOutTime = 0.03;
function removeSound(id: number, force?: boolean, ambiance?: boolean) {
	const sound = sounds.get(id);
	playingSounds.delete(id);
	if (sound?.source) {
		if (sound.ambiance && !ambiance) return;
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

export function removeAllSounds(ambiance?: boolean) {
	for (const id of sounds.keys()) {
		removeSound(id, true, ambiance);
	}
}

export function stopAllLooping(ambiance?: boolean) {
	for (const id of sounds.keys()) {
		const sound = sounds.get(id);
		if (sound?.source) {
			if (sound.ambiance && !ambiance) return;
			sound.source.loop = false;
		}
	}
}

export function stopLooping(id: number) {
	const sound = sounds.get(id);
	if (sound?.source) {
		sound.source.loop = false;
	}
}
