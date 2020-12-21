import {useEffect, useRef} from "react";
import Button from "client/components/ui/button";
import {
  usePlayerForwardVelocitySubscription,
  usePlayerImpulseSubscription,
  usePlayerSetImpulseMutation,
} from "client/generated/graphql";
import {useTranslation} from "react-i18next";
import {css} from "@emotion/core";
import {useSpring, animated as a} from "react-spring";
import {useDrag} from "react-use-gesture";
import throttle from "lodash.throttle";
import useMeasure from "client/helpers/hooks/useMeasure";

const ForwardVelocity = () => {
  const {data: velocityData} = usePlayerForwardVelocitySubscription();
  const ship = velocityData?.playerShipHot;
  if (!ship) return null;
  return (
    <div className="forward-velocity text-xl w-full py-2 text-center bg-blackAlpha-500 border-2 border-whiteAlpha-500 rounded">
      <div>Forward Velocity:</div>
      <div className="font-bold text-3xl my-2 tabular-nums">
        {ship.forwardVelocity > 1
          ? `${ship.forwardVelocity.toLocaleString(undefined, {
              minimumFractionDigits: 1,
              maximumFractionDigits: 1,
            })} km/s`
          : `${(ship.forwardVelocity * 1000).toLocaleString(undefined, {
              minimumFractionDigits: 1,
              maximumFractionDigits: 1,
            })} m/s`}
      </div>
    </div>
  );
};

const KNOB_HEIGHT = 44;
const BUTTON_OFFSET = 0.8;
export const Impulse = ({cardLoaded = true}) => {
  const {data: impulseData} = usePlayerImpulseSubscription();
  const [setImpulse] = usePlayerSetImpulseMutation();
  const impulse = impulseData?.impulseEnginesOutfit;
  const downRef = useRef(false);
  const {t} = useTranslation();
  const [ref, measurement, getMeasurements] = useMeasure<HTMLDivElement>();
  const [{y}, set] = useSpring(() => ({
    y: 0,
    config: {mass: 1, tension: 280, friction: 30},
  }));
  const callback = useRef(
    throttle((speed: number) => {
      setImpulse({variables: {speed}});
    }, 100)
  );
  const targetSpeed = impulse?.impulseEngines.targetSpeed || 0;
  const cruisingSpeed = impulse?.impulseEngines.cruisingSpeed || 1;
  const emergencySpeed = impulse?.impulseEngines.emergencySpeed || 1;
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
      initial: () => [0, y.get()],
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

  if (!impulse) return null;
  return (
    <div className="select-none flex-1">
      <div>
        <div className="flex flex-col gap-2">
          <ForwardVelocity />
          <div className="target-velocity text-xl w-full py-2 text-center bg-blackAlpha-500 border-2 border-whiteAlpha-500 rounded">
            <div>Target Velocity:</div>

            <p className="font-bold text-3xl my-2 tabular-nums">
              {impulse.impulseEngines.targetSpeed > 1
                ? `${impulse.impulseEngines.targetSpeed.toLocaleString(
                    undefined,
                    {
                      minimumFractionDigits: 1,
                      maximumFractionDigits: 1,
                    }
                  )} km/s`
                : `${(impulse.impulseEngines.targetSpeed * 1000).toLocaleString(
                    undefined,
                    {
                      minimumFractionDigits: 1,
                      maximumFractionDigits: 1,
                    }
                  )} m/s`}
            </p>
          </div>
        </div>
        {/* TODO: Include heat indicator here eventually. */}
        <p className="text-xl mt-4">Impulse Speed:</p>

        <div className="flex">
          <div className="flex flex-1 flex-col justify-around text-right mr-8">
            <Button
              onClick={() => callback.current(emergencySpeed)}
              variantColor="danger"
            >
              {t("Emergency")}
            </Button>
            <Button
              onClick={() => callback.current(cruisingSpeed)}
              variantColor="warning"
            >
              {t("Full")}
            </Button>
            <Button onClick={() => callback.current((cruisingSpeed * 3) / 4)}>
              {t("3/4")}
            </Button>
            <Button onClick={() => callback.current((cruisingSpeed * 1) / 2)}>
              {t("1/2")}
            </Button>
            <Button onClick={() => callback.current((cruisingSpeed * 1) / 4)}>
              {t("1/4")}
            </Button>
            <Button onClick={() => callback.current(0)} variantColor="muted">
              {t("Full Stop")}
            </Button>
          </div>

          <div
            ref={ref}
            css={css`
              min-height: 20rem;
            `}
            className="h-0 relative bg-blackAlpha-500 border-2 border-whiteAlpha-500 rounded-full flex justify-center items-end"
          >
            <a.div
              {...bind()}
              style={{transform: y?.to(y => `translate3d(0px,${y}px,0)`)}}
              className="z-10 w-10 h-10 rounded-full border-blackAlpha-500 border-2 bg-gray-500 shadow-md cursor-pointer"
            ></a.div>
          </div>
        </div>
      </div>
    </div>
  );
};
