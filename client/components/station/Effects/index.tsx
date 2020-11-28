import {useApolloClient} from "@apollo/client";
import {Fragment, useCallback, useEffect, useRef, useState} from "react";
import {EffectsDocument, EffectsSubscription} from "client/generated/graphql";
import uuid from "uniqid";
import Spark from "./spark";

let synth: SpeechSynthesis | undefined;
try {
  synth = window.speechSynthesis;
} catch {}

const useFlash = () => {
  const [flash, setFlash] = useState(false);
  const timeoutRef = useRef<number | undefined>();
  const doFlash = useCallback(duration => {
    clearTimeout(timeoutRef.current);
    duration = duration || duration === 0 ? duration : 10;
    if (duration <= 0) {
      return setFlash(false);
    }
    setFlash(oldFlash => !oldFlash);
    timeoutRef.current = (setTimeout(
      () => doFlash(duration - 1),
      150
    ) as unknown) as number;
  }, []);
  useEffect(() => () => clearTimeout(timeoutRef.current), []);
  return {flash, doFlash};
};

const useSpark = () => {
  const [sparks, setSparks] = useState<string[]>([]);
  const timeoutRef = useRef<number[]>([]);
  const doSpark = useCallback(duration => {
    duration = duration || 5000;
    const id = uuid();
    setSparks(sparks => [...sparks, id]);
    const timeout = (setTimeout(() => {
      setSparks(sparks => sparks.filter(s => s !== id));
    }, duration) as unknown) as number;
    timeoutRef.current.push(timeout);
  }, []);
  useEffect(() => {
    // eslint-disable-next-line
    return () => timeoutRef.current.forEach(ref => clearTimeout(ref));
  }, []);
  const Sparks = () => (
    <Fragment>
      {sparks.map(s => (
        <Spark key={s} />
      ))}
    </Fragment>
  );
  return {
    doSpark,
    Sparks,
  };
};

export const Effects = () => {
  const {flash, doFlash} = useFlash();
  const {doSpark, Sparks} = useSpark();
  const client = useApolloClient();
  useEffect(() => {
    const subscription = client
      .subscribe({
        query: EffectsDocument,
      })
      .subscribe({
        next({
          data: {
            effect: {effect, config},
          },
        }: {
          data: EffectsSubscription;
        }) {
          switch (effect) {
            case "flash":
              return doFlash(config?.duration || 5000);
            case "spark":
              return doSpark(config?.duration || 5000);
            case "reload":
              return window.location.reload();
            case "speak": {
              try {
                const voices = synth?.getVoices() || [];
                if (!config?.message) return;
                const words = new SpeechSynthesisUtterance(config.message);
                if (config.voice && words) {
                  const voice = voices.find(v => v.name === config.voice);
                  if (voice) {
                    words.voice = voice;
                  }
                }
                return synth?.speak(words);
              } catch {}
            }
            case "shutdown":
            case "restart":
            case "sleep":
            case "quit":
            case "beep":
              return window.thorium.sendMessage({effect});
            default:
              return;
          }
        },
        error(err) {
          console.error("err", err);
        },
      });
    return () => subscription.unsubscribe();
  }, [client, doFlash, doSpark]);
  return (
    <div className={`actionsContainer ${flash ? "flash" : ""}`}>
      <Sparks />
    </div>
  );
};
