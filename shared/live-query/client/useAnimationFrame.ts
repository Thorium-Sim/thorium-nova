import {useRef, useEffect} from "react";

const useAnimationFrame = (
  callback: (delta: number) => void,
  active = true
) => {
  const callbackRef = useRef(callback);
  const time = useRef(performance.now());

  useEffect(() => {
    callbackRef.current = callback;
  }, [callback]); // eslint-disable-line react-hooks/exhaustive-deps

  const frameRef = useRef<number>(0);

  useEffect(() => {
    const loop = (now: number) => {
      const diff = now - (time.current || now - 16);
      time.current = now;
      frameRef.current = requestAnimationFrame(loop);
      const cb = callbackRef.current;
      cb(diff);
    };
    if (active) {
      time.current = performance.now();
      frameRef.current = requestAnimationFrame(loop);
    } else {
      cancelAnimationFrame(frameRef.current);
    }
    return () => cancelAnimationFrame(frameRef.current);
  }, [active]);
};

export default useAnimationFrame;
