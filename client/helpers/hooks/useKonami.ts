import {useEffect, useRef} from "react";

export function useKonami(callback = () => {}) {
  const keys = useRef<string[]>([]);

  const callbackRef = useRef(callback);
  useEffect(() => {
    callbackRef.current = callback;
  }, [callback]);

  // Set up the key handler
  useEffect(() => {
    // Key handler event
    const downHandler = (e: KeyboardEvent) => {
      let key: string | null = null;
      if (e.code === "ArrowUp") key = "u";
      if (e.code === "ArrowDown") key = "d";
      if (e.code === "ArrowLeft") key = "l";
      if (e.code === "ArrowRight") key = "r";
      if (e.code === "KeyA") key = "a";
      if (e.code === "KeyB") key = "b";

      if (key) {
        // Slice it down to the correct size
        if (keys.current.length >= 10) {
          keys.current = keys.current.concat(key).slice(1, 11);
        } else {
          keys.current = keys.current.concat(key);
        }
        if (keys.current.join("") === "uuddlrlrba") {
          callbackRef.current?.();
          keys.current = [];
        }
      } else {
        // If there is a stray key, cancel the whole konami code
        keys.current = [];
      }
    };

    window.addEventListener("keydown", downHandler, {passive: true});
    // Remove event listeners on cleanup
    return () => {
      window.removeEventListener("keydown", downHandler);
    };
  }, []);
}
