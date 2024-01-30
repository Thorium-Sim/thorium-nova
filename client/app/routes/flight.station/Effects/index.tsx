import {Fragment, useCallback, useEffect, useRef, useState} from "react";
import uuid from "@thorium/uniqid";
import Spark from "./spark";
import "./effects.css";
import {q} from "@client/context/AppContext";
import {type EffectPayload} from "@client/utils/effects";
import {useNavigate} from "@remix-run/react";

let synth: SpeechSynthesis | undefined;
try {
  synth = window.speechSynthesis;
} catch {}

const useFlash = () => {
  const [flash, setFlash] = useState(false);
  const timeoutRef = useRef<number | undefined>();
  const doFlash = useCallback((duration: number, lastTime = Date.now()) => {
    clearTimeout(timeoutRef.current);
    duration = duration || duration === 0 ? duration : 1000;
    if (duration <= 0) {
      return setFlash(false);
    }
    setFlash(oldFlash => !oldFlash);

    timeoutRef.current = setTimeout(
      () => doFlash(duration - (Date.now() - lastTime), Date.now()),
      75
    ) as unknown as number;
  }, []);
  useEffect(() => () => clearTimeout(timeoutRef.current), []);
  return {flash, doFlash};
};

const useSpark = () => {
  const [sparks, setSparks] = useState<string[]>([]);
  const timeoutRef = useRef<number[]>([]);
  const doSpark = useCallback((duration: number = 5000) => {
    const id = uuid();
    setSparks(sparks => [...sparks, id]);
    const timeout = setTimeout(() => {
      setSparks(sparks => sparks.filter(s => s !== id));
    }, duration) as unknown as number;
    timeoutRef.current.push(timeout);
  }, []);
  useEffect(() => {
    // eslint-disable-next-line
    return () => timeoutRef.current.forEach(ref => clearTimeout(ref));
  }, []);
  return {
    doSpark,
    sparks,
  };
};

function useEscapeHotkey() {
  const navigate = useNavigate();
  useEffect(() => {
    function handleKeydown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        navigate("/flight/lobby");
      }
    }
    document.addEventListener("keydown", handleKeydown);

    return () => document.removeEventListener("keydown", handleKeydown);
  }, []);
}

const Effects = () => {
  const {flash, doFlash} = useFlash();
  const {doSpark, sparks} = useSpark();

  useEscapeHotkey();

  const doEffect = useCallback(
    (payload: EffectPayload) => {
      if (typeof payload === "boolean" || !payload) return;
      const {effect, config} = payload;
      switch (effect) {
        case "flash":
          return doFlash(config?.duration || 1000);
        case "spark":
          return doSpark(config?.duration || 5000);
        case "reload":
          return window.location.reload();
        case "speak": {
          try {
            const voices = synth?.getVoices() || [];
            if (!config?.message) return;
            const words = new SpeechSynthesisUtterance(config.message);
            if (words) {
              const voice =
                voices.find(v => v.name === config.voice) || voices[0];
              if (voice) {
                words.voice = voice;
              }
            }
            return synth?.speak(words);
          } catch {}
          break;
        }
        // case "shutdown":
        // case "restart":
        // case "sleep":
        // case "quit":
        // case "beep":
        //   // TODO November 29, 2021: Implement the message transmission
        //   // to the Electron instance.
        //   // return window.thorium.sendMessage({effect});
        // break;
        default:
          return;
      }
    },
    [doFlash, doSpark]
  );

  q.effects.sub.useNetRequest(undefined, {callback: doEffect});

  return (
    <div className={`actionsContainer ${flash ? "flash" : ""}`}>
      {sparks.map(s => (
        <Spark key={s} />
      ))}
    </div>
  );
};

export default Effects;
