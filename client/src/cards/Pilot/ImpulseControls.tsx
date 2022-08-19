import {useEffect, useRef} from "react";

import {useSpring, animated as a} from "@react-spring/web";
import {useDrag} from "@use-gesture/react";
import throttle from "lodash.throttle";
// import {
//   useForwardVelocityStore,
//   usePlayerForwardVelocity,
// } from "client/components/viewscreen/usePlayerForwardVelocity";
import {KilometerPerSecond} from "server/src/utils/unitTypes";
import useMeasure from "client/src/hooks/useMeasure";
import Button from "@thorium/ui/Button";
import {useNetRequest} from "client/src/context/useNetRequest";
import {netSend} from "client/src/context/netSend";
import {useThorium} from "client/src/context/ThoriumContext";
import useAnimationFrame from "client/src/hooks/useAnimationFrame";

const C_IN_METERS = 299792458;
function formatSpeed(speed: KilometerPerSecond) {
  if (Math.abs(speed) > C_IN_METERS / 1000 / 2) {
    return `${(speed / (C_IN_METERS / 1000)).toLocaleString(undefined, {
      minimumFractionDigits: 1,
      maximumFractionDigits: 1,
    })} C`;
  }
  if (Math.abs(speed) > 1) {
    return `${speed.toLocaleString(undefined, {
      minimumFractionDigits: 1,
      maximumFractionDigits: 1,
    })} km/s`;
  }
  7;

  return `${(speed * 1000).toLocaleString(undefined, {
    minimumFractionDigits: 1,
    maximumFractionDigits: 1,
  })} m/s`;
}

const ForwardVelocity = () => {
  const forwardRef = useRef<HTMLDivElement>(null);
  const targetRef = useRef<HTMLDivElement>(null);

  const {id: impulseId, targetSpeed} = useNetRequest("pilotImpulseEngines");
  const {id: warpId, maxVelocity} = useNetRequest("pilotWarpEngines");
  const {interpolate} = useThorium();

  const targetVelocity = targetSpeed || maxVelocity;

  useAnimationFrame(() => {
    const warpInterpolation = interpolate(warpId);
    const {x: warpForward, y: warpMax} = warpInterpolation || {x: 0, y: 0};

    const impulseInterpolation = interpolate(impulseId);
    const {x: impulseForward} = impulseInterpolation || {x: 0};

    const targetVelocity = Math.max(targetSpeed, warpMax);
    if (targetRef.current) {
      targetRef.current.textContent = formatSpeed(targetVelocity);
    }
    if (forwardRef.current) {
      forwardRef.current.textContent = formatSpeed(
        Math.max(warpForward, impulseForward)
      );
    }
  });

  return (
    <>
      <div className="panel text-center">
        <div>Forward Velocity:</div>
        <div className="font-bold text-3xl my-2 tabular-nums" ref={forwardRef}>
          {formatSpeed(0)}
        </div>
      </div>
      <div className="panel text-center">
        <div>Target Velocity:</div>

        <p className="font-bold text-3xl my-2 tabular-nums" ref={targetRef}>
          {formatSpeed(targetVelocity)}
        </p>
      </div>
    </>
  );
};

const KNOB_HEIGHT = 44;
const BUTTON_OFFSET = 0.8;
export const ImpulseControls = ({cardLoaded = true}) => {
  const {targetSpeed, cruisingSpeed, emergencySpeed} = useNetRequest(
    "pilotImpulseEngines"
  );
  const {warpFactorCount, currentWarpFactor} =
    useNetRequest("pilotWarpEngines");
  const downRef = useRef(false);
  const [ref, measurement, getMeasurements] = useMeasure<HTMLDivElement>();
  const [{y}, set] = useSpring(() => ({
    y: 0,
    config: {mass: 1, tension: 280, friction: 30},
  }));

  const callback = useRef(
    throttle((speed: number) => {
      netSend("impulseEnginesSetSpeed", {speed});
      if (speed === 0) {
        netSend("warpEnginesSetWarpFactor", {factor: 0});
      }
    }, 100)
  );

  const bind = useDrag(
    ({down, first, movement: [_, yVal]}) => {
      downRef.current = down;
      set({
        y: yVal,
        immediate: down,
      });
      const normalizedValue = Math.min(
        1,
        Math.abs(1 - yVal) / (measurement.height - KNOB_HEIGHT)
      );

      const speedValue =
        normalizedValue < 0.005
          ? 0
          : normalizedValue <= BUTTON_OFFSET
          ? normalizedValue * (1 / BUTTON_OFFSET) * cruisingSpeed
          : (normalizedValue - BUTTON_OFFSET) *
              (1 / (1 - BUTTON_OFFSET)) *
              (emergencySpeed - cruisingSpeed) +
            cruisingSpeed;
      callback.current(speedValue);
    },
    {
      axis: "y",
      bounds: {bottom: 0, top: -measurement.height + KNOB_HEIGHT},
      from: () => [0, y.get()],
    }
  );

  const height = measurement.height;
  useEffect(() => {
    if (downRef.current) return;
    getMeasurements();
    const y =
      (targetSpeed / cruisingSpeed <= 1
        ? (targetSpeed / cruisingSpeed) * BUTTON_OFFSET
        : BUTTON_OFFSET +
          ((targetSpeed - cruisingSpeed) / (emergencySpeed - cruisingSpeed)) *
            (1 - BUTTON_OFFSET)) *
      (-height + KNOB_HEIGHT);
    set({
      y,
    });
  }, [
    targetSpeed,
    cruisingSpeed,
    emergencySpeed,
    set,
    height,
    getMeasurements,
    cardLoaded,
  ]);

  return (
    <div className="select-none flex-1">
      <div>
        <div className="flex flex-col gap-2">
          <ForwardVelocity />
        </div>
        {/* TODO: Include heat indicator here eventually. */}

        <div className="flex  mt-4">
          <div className="flex-1">
            <p className="text-xl">Impulse Speed:</p>
            <div className="flex">
              <div className="flex flex-1 flex-col justify-around text-right mr-4">
                <Button
                  onClick={() => callback.current(emergencySpeed)}
                  className="btn-error"
                >
                  Emergency
                </Button>
                <Button
                  onClick={() => callback.current(cruisingSpeed)}
                  className="btn-warning"
                >
                  Full
                </Button>
                <Button
                  className="btn-primary"
                  onClick={() => callback.current((cruisingSpeed * 3) / 4)}
                >
                  3/4
                </Button>
                <Button
                  className="btn-primary"
                  onClick={() => callback.current((cruisingSpeed * 1) / 2)}
                >
                  1/2
                </Button>
                <Button
                  className="btn-primary"
                  onClick={() => callback.current((cruisingSpeed * 1) / 4)}
                >
                  1/4
                </Button>
                <Button
                  onClick={() => callback.current(0)}
                  className="btn-notice"
                >
                  Full Stop
                </Button>
              </div>
              <div
                ref={ref}
                className="h-0 min-h-[20rem] relative bg-blackAlpha-500 border-2 border-whiteAlpha-500 rounded-full flex justify-center items-end"
              >
                <a.div
                  {...bind()}
                  style={{transform: y?.to(y => `translate3d(0px,${y}px,0)`)}}
                  className="z-10 w-10 h-10 rounded-full border-blackAlpha-500 border-2 bg-gray-500 shadow-md cursor-pointer"
                ></a.div>
              </div>
            </div>
          </div>

          <div className="flex flex-1 flex-col justify-around ml-6">
            <p className="text-xl">Warp Speed:</p>
            <div className="flex flex-col justify-around h-full">
              <Button
                className={`btn-error ${
                  currentWarpFactor === warpFactorCount + 1 ? "btn-active" : ""
                }`}
                onClick={() =>
                  netSend("warpEnginesSetWarpFactor", {
                    factor: warpFactorCount + 1,
                  })
                }
              >
                Emergency Warp
              </Button>
              {Array.from({
                length: warpFactorCount,
              }).map((_, i, arr) => {
                const warpFactor = arr.length - i;
                return (
                  <Button
                    key={`warp-${warpFactor}`}
                    className={`btn-primary ${i === 0 ? "warning" : ""} ${
                      warpFactor === currentWarpFactor ? "btn-active" : ""
                    }`}
                    onClick={() =>
                      netSend("warpEnginesSetWarpFactor", {factor: warpFactor})
                    }
                  >
                    Warp {warpFactor}
                  </Button>
                );
              })}
              <Button
                className="btn-notice"
                onClick={() => callback.current(0)}
              >
                Full Stop
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
