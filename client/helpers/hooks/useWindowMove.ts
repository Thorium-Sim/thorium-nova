import React from "react";
import useMeasure from "./useMeasure";
import useEventListener from "./useEventListener";

type coords = {x: number; y: number};
export default function useWindowMove([position, setPosition]: [
  coords | null,
  React.Dispatch<React.SetStateAction<coords | null>>
]): [coords, (node: HTMLElement) => void, () => void, () => void] {
  const [measureRef, dimensions, measure] = useMeasure();
  const isMouseDown = React.useRef(false);

  React.useEffect(() => {
    if (!position && dimensions.width) {
      setPosition({
        x: window.innerWidth / 2 - dimensions.width / Math.E,
        y: 50,
      });
    }
  }, [dimensions.width, position, setPosition]);

  const mouseMove = React.useCallback(
    evt => {
      if (isMouseDown.current) {
        setPosition(position => ({
          x: Math.max(
            0,
            Math.min(
              window.innerWidth - dimensions.width,
              (position?.x || 0) + evt.movementX
            )
          ),
          y: Math.max(
            0,
            Math.min(
              window.innerHeight - dimensions.height,
              (position?.y || 0) + evt.movementY
            )
          ),
        }));
      }
    },
    [dimensions.width, dimensions.height, setPosition]
  );

  const mouseUp = React.useCallback(() => {
    isMouseDown.current = false;
  }, []);
  const mouseDown = React.useCallback(() => {
    isMouseDown.current = true;
  }, []);
  useEventListener("mousemove", mouseMove);
  useEventListener("mouseup", mouseUp);

  return [position || {x: 0, y: 0}, measureRef, mouseDown, measure];
}
