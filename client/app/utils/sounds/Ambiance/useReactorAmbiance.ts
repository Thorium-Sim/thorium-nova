import { q } from "@client/context/AppContext";
import {
	playSound,
	removeSound,
	soundIsPlaying,
	updateSound,
} from "@client/utils/sounds/playSound";
import { useEffect, useRef } from "react";

function volumeRangeToVolume(volumeRange: [number, number], volume: number) {
	return volume * (volumeRange[1] - volumeRange[0]) + volumeRange[0];
}

/** This hook should do the following:
 * - Play ambiance sounds
 * - Update ambiance sounds whenever their properties change
 */
export function useReactorAmbiance() {
	const [reactors, { dataUpdatedAt }] =
		q.systemsMonitor.reactors.ambiance.useNetRequest(undefined, {
			refetchInterval: 2000,
		});

	const soundsRef = useRef(new Set<string>());

	useEffect(() => {
		// Making the useEffect hook dependent on dataUpdatedAt ensures that the
		// hook runs whenever the data is updated.
		dataUpdatedAt;
		for (const reactor of reactors) {
			if (reactor.ambiance) {
				for (let i = 0; i < reactor.ambiance.length; i++) {
					const id = `reactor-${reactor.id}-ambiance-${i}`;
					const sound = reactor.ambiance[i];
					const volume = volumeRangeToVolume(
						sound.volume,
						reactor.volumePercent,
					);
					if (!soundIsPlaying(id)) {
						playSound({
							id,
							type: "ambiance",
							channel: sound.channel,
							delay: 0,
							url: sound.url,
							loop: true,
							loopStart: 0,
							loopEnd: 1,
							loopGap: 0,
							playbackRate: [1, 1],
							volume: [volume / reactors.length, volume / reactors.length],
						});
						soundsRef.current.add(id);
					} else {
						updateSound(id, {
							volume: volume / reactors.length,
						});
					}
				}
			}
		}
	}, [reactors, dataUpdatedAt]);

	useEffect(() => {
		return () => {
			for (const id of soundsRef.current) {
				removeSound(id, true);
				soundsRef.current.delete(id);
			}
		};
	}, []);
}
