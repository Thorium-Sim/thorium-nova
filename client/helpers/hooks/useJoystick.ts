import throttle from "lodash.throttle";
import * as React from "react";
import {useSpring} from "react-spring";
import {useDrag} from "react-use-gesture";

function distance(x1: number, y1: number, x2 = 0, y2 = 0) {
  const a = x1 - x2;
  const b = y1 - y2;

  return Math.sqrt(a * a + b * b);
}
const minDistance = 10;
export function useJoystick({
  axisSnap,
  axis,
  onDrag = () => {},
  throttleMs = 100,
}: {
  axisSnap?: boolean;
  axis?: "x" | "y" | undefined;
  onDrag?: (values: {x: number; y: number}) => void;
  throttleMs?: number;
} = {}) {
  const callback = React.useRef(throttle(onDrag, throttleMs));
  const containerRef = React.useRef<HTMLDivElement>(null);
  const maxDistance = React.useRef(0);
  const [{xy}, set] = useSpring(() => ({
    xy: [0, 0],
    config: {mass: 1, tension: 280, friction: 30},
  }));
  const bind = useDrag(
    ({down, first, movement: [x, y]}) => {
      if (first) {
        maxDistance.current =
          (containerRef.current?.getBoundingClientRect()[
            axis === "y" ? "height" : "width"
          ] || 0) / 2;
      }
      const dist = distance(x, y);
      if (dist > maxDistance.current) {
        const theta = Math.abs(Math.atan(y / x));
        x = maxDistance.current * Math.cos(theta) * (x > 0 ? 1 : -1);
        y = maxDistance.current * Math.sin(theta) * (y > 0 ? 1 : -1);
      }
      if (
        axisSnap &&
        (Math.abs(x) > minDistance || Math.abs(y) > minDistance)
      ) {
        if (x < minDistance && x > minDistance * -1) x = 0;
        if (y < minDistance && y > minDistance * -1) y = 0;
      }
      set({
        xy: down ? [x, y] : [0, 0],
        immediate: down,
      });
      callback.current?.(
        down
          ? {x: x / maxDistance.current, y: y / maxDistance.current}
          : {x: 0, y: 0}
      );
    },
    {axis}
  );
  return [xy, bind, containerRef] as const;
}
