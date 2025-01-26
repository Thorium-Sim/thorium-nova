import { useKonami } from "./useKonami";

const synth = typeof window === "undefined" ? null : window.speechSynthesis;

/** A tribute to my dad **/
const song = `The thunder god a riding went upon his favorite filly.
I’m Thor he cried, His horse replied “You forgot your thaddle thilly”`;

export default function useEasterEgg() {
	useKonami(() => {
		synth?.cancel();
		const utterance = new SpeechSynthesisUtterance(song);
		synth?.speak(utterance);
	});
}
