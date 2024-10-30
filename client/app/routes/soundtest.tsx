import {
	playSound,
	removeAllSounds,
	stopLooping,
} from "@client/utils/sounds/playSound";
import Button from "@thorium/ui/Button";

const defaultSound = {
	id: 0,
	url: "/assets/star-tours-chime-ringtone.ogg",
	channel: null,
	delay: 0,
	gap: 0,
	loop: false,
	loopEnd: null,
	loopStart: null,
	playbackRate: [1, 1],
	volume: [1, 1],
} satisfies Parameters<typeof playSound>[0];
export default function SoundTest() {
	return (
		<div className="flex gap-2">
			<Button
				onClick={() => {
					playSound({
						...defaultSound,
						id: Math.random(),
					});
				}}
			>
				Normal
			</Button>
			<Button
				onClick={() => {
					playSound({
						...defaultSound,
						id: Math.random(),
						playbackRate: [0.95, 1.05],
					});
				}}
			>
				Pitch
			</Button>
			<Button
				onClick={() => {
					playSound({
						...defaultSound,
						id: Math.random(),
						loop: true,
						loopStart: 0.25,
						loopEnd: 1,
					});
				}}
			>
				Loop
			</Button>

			<Button
				className="btn-error"
				onClick={() => {
					removeAllSounds();
				}}
			>
				Cancel All
			</Button>

			<Button
				className="btn-error"
				onClick={() => {
					stopLooping();
				}}
			>
				Stop Looping
			</Button>
		</div>
	);
}
