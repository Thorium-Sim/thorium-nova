import {useRef, useLayoutEffect} from "react";

const callbacks = new Set<React.MutableRefObject<FrameRequestCallback>>();

let time = performance.now();
function loop(now: DOMHighResTimeStamp) {
  const diff = now - (time || now - 16);

  callbacks.forEach(cb => cb.current?.(diff));
  requestAnimationFrame(loop);
}

if (typeof window !== "undefined") {
  requestAnimationFrame(loop);
}

const useAnimationFrame = (
  callback: (delta: number) => void,
  active = true
) => {
  const callbackRef = useRef(callback);

  useLayoutEffect(() => {
    callbackRef.current = callback;
  }, [callback]);

  useLayoutEffect(() => {
    if (active) {
      callbacks.add(callbackRef);
    } else {
      callbacks.delete(callbackRef);
    }
    return () => {
      callbacks.delete(callbackRef);
    };
  }, [active]);
};

export default useAnimationFrame;
