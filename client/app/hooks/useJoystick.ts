import throttle from "lodash.throttle";
import {useSpring} from "@react-spring/web";
import {useDrag} from "@use-gesture/react";
import {useRef} from "react";
import {type GamepadKey, useGamepadValue} from "./useGamepadStore";

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
  gamepadKeys,
}: {
  axisSnap?: boolean;
  axis?: "x" | "y" | undefined;
  onDrag?: (values: {x: number; y: number}) => void;
  throttleMs?: number;
  gamepadKeys?: {x: GamepadKey; y: GamepadKey};
} = {}) {
  const callback = useRef(throttle(onDrag, throttleMs));
  const containerRef = useRef<HTMLDivElement>(null);
  const dragDown = useRef(false);
  const maxDistance = useRef(0);
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
      dragDown.current = down;
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

  const gamepadValues = useRef([0, 0]);

  function setGamepadValue() {
    if (dragDown.current) return;
    if (!maxDistance.current) {
      maxDistance.current =
        (containerRef.current?.getBoundingClientRect()[
          axis === "y" ? "height" : "width"
        ] || 0) / 2;
    }
    let [x, y] = gamepadValues.current;
    x *= maxDistance.current;
    y *= maxDistance.current;
    const dist = distance(x, y);
    if (dist > maxDistance.current) {
      const theta = Math.abs(Math.atan(y / x));
      x = maxDistance.current * Math.cos(theta) * (x > 0 ? 1 : -1);
      y = maxDistance.current * Math.sin(theta) * (y > 0 ? 1 : -1);
    }
    set({
      xy: [x, y],
      immediate: true,
    });
    callback.current?.({
      x: x / maxDistance.current,
      y: y / maxDistance.current,
    });
  }
  useGamepadValue(gamepadKeys?.x, value => {
    gamepadValues.current[0] = value;
    setGamepadValue();
  });
  useGamepadValue(gamepadKeys?.y, value => {
    gamepadValues.current[1] = value;
    setGamepadValue();
  });
  return [xy, bind, containerRef] as const;
}
