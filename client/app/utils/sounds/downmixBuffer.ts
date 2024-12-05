import { audioContext } from "./audioContext";

function copyToChannel(
	destination: AudioBuffer,
	source: Float32Array,
	channelNumber: number,
	multiplier = 1,
) {
	try {
		const nowBuffering = destination.getChannelData(channelNumber);
		for (let i = 0; i < source.length; i++) {
			nowBuffering[i] += source[i] * multiplier;
		}
	} catch (error) {
		console.error(error);
	}
	return destination;
}

/**
 * Cases handled by this
 * - Source: mono
 * - Destination: any
 * - Outcome: copy to destination
 *
 * - Source: stereo
 * - Destination: mono
 * - Outcome: Downmix to mono
 *
 * - Source: n channels
 * - Destination: n channels
 * - Outcome: copy to destination
 *
 * - Source: stereo
 * - Destination: stereo+
 * - Outcome: Downmix to mono, and copy to channels
 **/

export function downMixBuffer(
	sourceBuffer: AudioBuffer,
	destinationChannels: number[],
) {
	if (!audioContext) return sourceBuffer;
	let destinationBuffer = audioContext.createBuffer(
		audioContext.destination.channelCount,
		sourceBuffer.duration * audioContext.sampleRate,
		audioContext.sampleRate,
	);
	if (sourceBuffer.numberOfChannels === destinationChannels.length) {
		// Copy the source channels to their corresponding destination channels
		for (let i = 0; i < sourceBuffer.numberOfChannels; i++) {
			destinationBuffer = copyToChannel(
				destinationBuffer,
				sourceBuffer.getChannelData(i),
				destinationChannels[i],
			);
		}
	} else {
		// Downmix to mono and copy to each destination channel
		for (const channel of destinationChannels) {
			//Combine the source channels into one.
			for (let i = 0; i < sourceBuffer.numberOfChannels; i++) {
				destinationBuffer = copyToChannel(
					destinationBuffer,
					sourceBuffer.getChannelData(i),
					channel,
					1 / sourceBuffer.numberOfChannels,
				);
			}
		}
	}
	return destinationBuffer;
}
