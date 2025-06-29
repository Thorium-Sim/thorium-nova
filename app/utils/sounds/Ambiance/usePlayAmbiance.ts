import { interpolateToRange } from "./interpolateToRange";
import { playSound, updateSound, removeSound } from "../playSound";
import type { Sound } from "@thorium/ecs-components/sound";
import { useRef, useEffect } from "react";

/** This hook should do the following:
 * - Play ambiance sounds
 * - Update ambiance sounds whenever their properties change
 */
export function usePlayAmbiance(
	soundKey: string,
	entities: {
		id: number;
		volumePercent: number;
		playbackRate: number;
		ambiance?: Sound[];
	}[],
	dataUpdatedAt: number,
) {
	const soundsRef = useRef(new Set<string>());

	useEffect(() => {
		// Making the useEffect hook dependent on dataUpdatedAt ensures that the
		// hook runs whenever the data is updated.
		dataUpdatedAt;
		for (const entity of entities) {
			if (entity.ambiance) {
				for (let i = 0; i < entity.ambiance.length; i++) {
					const id = `${soundKey}-${entity.id}-ambiance-${i}`;
					const sound = entity.ambiance[i];
					const volume = interpolateToRange(sound.volume, entity.volumePercent);
					const playbackRate = interpolateToRange(
						sound.playbackRate,
						entity.playbackRate,
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
							volume: [volume / entities.length, volume / entities.length],
						});
						soundsRef.current.add(id);
					} else {
						updateSound(id, {
							volume: volume / entities.length,
							playbackRate,
						});
					}
				}
			}
		}
	}, [entities, soundKey, dataUpdatedAt]);

	useEffect(() => {
		return () => {
			for (const id of soundsRef.current) {
				removeSound(id, true);
				soundsRef.current.delete(id);
			}
		};
	}, []);
}
