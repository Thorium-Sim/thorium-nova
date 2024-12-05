import { q } from "@client/context/AppContext";
import { interpolateToRange } from "@client/utils/sounds/Ambiance/interpolateToRange";
import {
	playSound,
	removeSound,
	soundIsPlaying,
	updateSound,
} from "@client/utils/sounds/playSound";
import { useEffect, useRef } from "react";

/** This hook should do the following:
 * - Play ambiance sounds
 * - Update ambiance sounds whenever their properties change
 */
export function useImpulseEnginesAmbiance() {
	const [impulseEngines, { dataUpdatedAt }] =
		q.pilot.impulseEngines.ambiance.useNetRequest(undefined, {
			refetchInterval: 2000,
		});

	const soundsRef = useRef(new Set<string>());

	useEffect(() => {
		// Making the useEffect hook dependent on dataUpdatedAt ensures that the
		// hook runs whenever the data is updated.
		dataUpdatedAt;
		for (const engine of impulseEngines) {
			if (engine.ambiance) {
				for (let i = 0; i < engine.ambiance.length; i++) {
					const id = `impulseEngines-${engine.id}-ambiance-${i}`;
					const sound = engine.ambiance[i];
					const volume = interpolateToRange(sound.volume, engine.volumePercent);
					const playbackRate = interpolateToRange(
						sound.playbackRate,
						engine.playbackRate,
					);
					if (!soundsRef.current.has(id)) {
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
							playbackRate: [playbackRate, playbackRate],
							volume: [
								volume / impulseEngines.length,
								volume / impulseEngines.length,
							],
						});
						soundsRef.current.add(id);
					} else {
						updateSound(id, {
							volume: volume / impulseEngines.length,
							playbackRate,
						});
					}
				}
			}
		}
	}, [impulseEngines, dataUpdatedAt]);

	useEffect(() => {
		return () => {
			for (const id of soundsRef.current) {
				removeSound(id, true);
				soundsRef.current.delete(id);
			}
		};
	}, []);
}
