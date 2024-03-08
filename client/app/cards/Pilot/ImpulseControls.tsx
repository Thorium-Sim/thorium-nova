import {useEffect, useRef, useState} from "react";

import {useSpring, animated as a} from "@react-spring/web";
import {useDrag} from "@use-gesture/react";
import throttle from "lodash.throttle";
import {KilometerPerSecond} from "@server/utils/unitTypes";
import useMeasure from "@client/hooks/useMeasure";
import Button from "@thorium/ui/Button";
import useAnimationFrame from "@client/hooks/useAnimationFrame";
import {useLiveQuery} from "@thorium/live-query/client";
import {q} from "@client/context/AppContext";
import {useGamepadPress, useGamepadValue} from "@client/hooks/useGamepadStore";

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

  return `${(speed * 1000).toLocaleString(undefined, {
    minimumFractionDigits: 1,
    maximumFractionDigits: 1,
  })} m/s`;
}

export function useForwardVelocity() {
  const [{targetSpeed}] = q.pilot.impulseEngines.get.useNetRequest();
  const [{maxVelocity: warpMax}] = q.pilot.warpEngines.get.useNetRequest();
  const [ship] = q.navigation.ship.useNetRequest();
  const {interpolate} = useLiveQuery();

  return function getForwardVelocity(): [
    KilometerPerSecond,
    KilometerPerSecond
  ] {
    const {f: forwardVelocity} = interpolate(ship.id) || {f: 0};

    const targetVelocity = Math.max(targetSpeed, warpMax);
    return [forwardVelocity, targetVelocity] as [
      KilometerPerSecond,
      KilometerPerSecond
    ];
  };
}
const ForwardVelocity = () => {
  const forwardRef = useRef<HTMLDivElement>(null);
  const targetRef = useRef<HTMLDivElement>(null);
  const getForwardVelocity = useForwardVelocity();

  useAnimationFrame(() => {
    const [forwardVelocity, targetVelocity] = getForwardVelocity();
    if (targetRef.current) {
      targetRef.current.textContent = formatSpeed(targetVelocity);
    }
    if (forwardRef.current) {
      forwardRef.current.textContent = formatSpeed(forwardVelocity);
    }
  });

  return (
    <>
      <div className="panel flex items-center px-4">
        <div className="max-w-min text-right leading-tight">
          Forward Velocity
        </div>
        <div
          className="w-full text-right font-bold text-2xl my-2 tabular-nums"
          ref={forwardRef}
        >
          {formatSpeed(0)}
        </div>
      </div>
      <div className="panel flex items-center px-4">
        <div className="max-w-min text-right leading-tight">
          Target Velocity
        </div>

        <p
          className="w-full text-right font-bold text-2xl my-2 tabular-nums"
          ref={targetRef}
        >
          {formatSpeed(0)}
        </p>
      </div>
    </>
  );
};

const KNOB_HEIGHT = 44;
const BUTTON_OFFSET = 0.8;
export const ImpulseControls = ({cardLoaded = true}) => {
  const [{targetSpeed, cruisingSpeed, emergencySpeed}] =
    q.pilot.impulseEngines.get.useNetRequest();

  const [{warpFactorCount, currentWarpFactor}] =
    q.pilot.warpEngines.get.useNetRequest();
  const downRef = useRef(false);
  const [ref, measurement, getMeasurements] = useMeasure<HTMLDivElement>();
  const [{y}, set] = useSpring(() => ({
    y: 0,
    config: {mass: 1, tension: 280, friction: 30},
  }));

  const callback = useRef(
    throttle((speed: number) => {
      q.pilot.impulseEngines.setSpeed.netSend({
        speed: Math.min(emergencySpeed, Math.max(0, speed)),
      });
      if (speed === 0) {
        q.pilot.warpEngines.setWarpFactor.netSend({factor: 0});
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

  useGamepadValue("impulse-speed", value => {
    const throttleValue = (value + 1) / 2;
    callback.current(throttleValue * cruisingSpeed);
  });

  const [impulseAdjust, setImpulseAdjust] = useState(0);
  const impulseAdjustVelocity = useRef(0);
  useGamepadValue("impulse-adjust", value => {
    setImpulseAdjust(value);
    impulseAdjustVelocity.current = 0;
  });

  useAnimationFrame(() => {
    const adjust =
      Math.min(
        Math.abs(impulseAdjustVelocity.current),
        Math.abs(impulseAdjust)
      ) * Math.sign(impulseAdjust);
    callback.current(targetSpeed + adjust);
    impulseAdjustVelocity.current += impulseAdjust / 500;
  }, impulseAdjust !== 0);

  // Warp Gamepad Control
  const [warpFocus, setWarpFocus] = useState(0);

  useGamepadValue("warp-focus-set", value => {
    setWarpFocus(
      Math.max(
        0,
        Math.min(
          warpFactorCount + 1,
          Math.round(((value + 1) / 2) * (warpFactorCount + 1))
        )
      )
    );
  });
  useGamepadPress("warp-focus-adjust", {
    onDown: val => {
      setWarpFocus(focus =>
        Math.max(0, Math.min(warpFactorCount + 1, Math.round(val + focus)))
      );
    },
  });
  useGamepadPress("warp-engage", {
    onDown: () => {
      q.pilot.warpEngines.setWarpFactor.netSend({
        factor: warpFocus,
      });
      setWarpFocus(0);
    },
  });
  useGamepadPress("full-stop", {
    onDown: () => {
      callback.current(0);
      setWarpFocus(0);
    },
  });
  return (
    <div className="select-none flex-1">
      <div>
        <div className="flex flex-col gap-1">
          <ForwardVelocity />
        </div>
        {/* TODO: Include heat indicator here eventually. */}

        <div className="flex mt-2 gap-1">
          <div className="flex-1">
            <p className="text-xl">Impulse Speed:</p>
            <div className="flex">
              <div className="flex flex-1 flex-col justify-around text-right gap-1">
                <Button
                  onClick={() => callback.current(emergencySpeed)}
                  className="btn-error btn-sm"
                >
                  Emergency
                </Button>
                <Button
                  onClick={() => callback.current(cruisingSpeed)}
                  className="btn-warning btn-sm"
                >
                  Full
                </Button>
                <Button
                  className="btn-primary btn-sm"
                  onClick={() => callback.current((cruisingSpeed * 3) / 4)}
                >
                  3/4
                </Button>
                <Button
                  className="btn-primary btn-sm"
                  onClick={() => callback.current((cruisingSpeed * 1) / 2)}
                >
                  1/2
                </Button>
                <Button
                  className="btn-primary btn-sm"
                  onClick={() => callback.current((cruisingSpeed * 1) / 4)}
                >
                  1/4
                </Button>
              </div>
            </div>
          </div>
          <div
            ref={ref}
            className="relative bg-blackAlpha-500 border-2 border-whiteAlpha-500 rounded-full flex justify-center items-end"
          >
            <a.div
              {...bind()}
              style={{transform: y?.to(y => `translate3d(0px,${y}px,0)`)}}
              className="z-10 w-10 h-10 rounded-full border-blackAlpha-500 border-2 bg-gray-500 shadow-md cursor-pointer"
            ></a.div>
          </div>
          <div className="flex flex-1 flex-col justify-around">
            <p className="text-xl">Warp Speed:</p>
            <div className="flex flex-col justify-around h-full gap-1">
              <Button
                className={`btn-sm btn-error ${
                  warpFocus === warpFactorCount + 1 ? "gamepad-focus" : ""
                }${
                  currentWarpFactor === warpFactorCount + 1 ? "btn-active" : ""
                }`}
                onClick={() =>
                  q.pilot.warpEngines.setWarpFactor.netSend({
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
                    className={`btn-sm btn-primary ${
                      warpFocus === warpFactor ? "gamepad-focus" : ""
                    } ${warpFactor === currentWarpFactor ? "btn-active" : ""}`}
                    onClick={() =>
                      q.pilot.warpEngines.setWarpFactor.netSend({
                        factor: warpFactor,
                      })
                    }
                  >
                    Warp {warpFactor}
                  </Button>
                );
              })}
            </div>
          </div>
        </div>
        <Button
          className="btn-notice w-full"
          onClick={() => callback.current(0)}
        >
          Full Stop
        </Button>
      </div>
    </div>
  );
};
