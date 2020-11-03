import React from "react";
import useMeasure from "./useMeasure";
import useEventListener from "./useEventListener";

type Box = {x: number; y: number; width: number; height: number};
export default function useDragSelect<DOMElement extends HTMLElement>(
  setSelectionBounds?: (param: {
    x1: number;
    x2: number;
    y1: number;
    y2: number;
  }) => void
) {
  const [dragPosition, setDragPosition] = React.useState<Box | null>(null);
  const [initialPosition, setInitialPosition] = React.useState<{
    x: number;
    y: number;
  } | null>(null);
  const [ref, dimensions, , node] = useMeasure<DOMElement>();

  // Create a ref that stores handler
  const savedHandler = React.useRef<Function>();

  // Update ref.current value if handler changes.
  // This allows our effect below to always get latest handler ...
  // ... without us needing to pass it in effect deps array ...
  // ... and potentially cause effect to re-run every render.
  React.useEffect(() => {
    savedHandler.current = setSelectionBounds;
  }, [setSelectionBounds]);

  function calculateCoordinates({x, y, width, height}: Box) {
    return {
      x1: x / dimensions.width,
      x2: (x + width) / dimensions.width,
      y1: y / dimensions.height,
      y2: (y + height) / dimensions.height,
    };
  }

  useEventListener("pointerdown", (e: MouseEvent) => {
    if (e.button !== 0) return;
    if (e.target === node) {
      setInitialPosition({
        x: e.clientX - dimensions.left,
        y: e.clientY - dimensions.top,
      });
      setDragPosition({
        x: e.clientX - dimensions.left,
        y: e.clientY - dimensions.top,
        width: 0,
        height: 0,
      });
    }
  });
  useEventListener("pointerup", () => {
    setDragPosition(null);
    setInitialPosition(null);
  });
  useEventListener("pointermove", (e: MouseEvent) => {
    if (dragPosition && initialPosition) {
      const position = {
        x:
          e.clientX - dimensions.left < initialPosition.x
            ? e.clientX - dimensions.left
            : initialPosition.x,
        y:
          e.clientY - dimensions.top < initialPosition.y
            ? e.clientY - dimensions.top
            : initialPosition.y,
        width: Math.abs(e.clientX - initialPosition.x - dimensions.left),
        height: Math.abs(e.clientY - initialPosition.y - dimensions.top),
      };
      setDragPosition(position);
      setSelectionBounds?.(calculateCoordinates(position));
    }
  });
  return [ref, dragPosition, node] as const;
}
