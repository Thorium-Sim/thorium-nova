/* istanbul ignore file */

import useKonami from "react-use-konami";
const synth = window.speechSynthesis;

/** A tribute to my dad **/
const song = `The thunder god a riding went upon his favorite filly.
I’m Thor he cried, His horse replied “You forgot your thaddle thilly”`;

export default function useEasterEgg() {
  useKonami(() => {
    synth?.cancel();
    synth?.speak(new SpeechSynthesisUtterance(song));
  });
}
