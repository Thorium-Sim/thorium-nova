import {useRef, useEffect} from "react";

export default function usePrevious<T>(value: T) {
  // The ref object is a generic container whose current property is mutable ...
  // ... and can hold any value, similar to an instance property on a class
  const ref = useRef([value]);

  // Store current value in ref
  useEffect(() => {
    ref.current.unshift(value);
    ref.current = ref.current.slice(0, 2);
  }, [value]); // Only re-run if value changes

  // Return previous value (happens before update in useEffect above)
  return ref.current[1] || ref.current[0];
}
