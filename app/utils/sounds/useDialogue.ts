import { q, clientId } from "@thorium/context/AppContext";
import { playSound, removeSound } from "@thorium/utils/sounds/playSound";

export function useDialogue() {
	q.effects.dialogue.useNetSubscribe({ clientId }, (dialogue) => {
		if (!dialogue) return;
		const soundKey = `${dialogue.shipId}-${dialogue.conversationId}`;
		if (dialogue.type === "dialogue") {
			playSound({
				id: soundKey,
				type: "dialogue",
				channel: null,
				delay: 0,
				url: dialogue.audioFilepath,
				loop: false,
				loopStart: null,
				loopEnd: null,
				loopGap: 0,
				playbackRate: [1, 1],
				volume: [1, 1],
			});
		}
		if (dialogue.type === "stopDialogue") {
			removeSound(soundKey, true);
		}
	});
}
