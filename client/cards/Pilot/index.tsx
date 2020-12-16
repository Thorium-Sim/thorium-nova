import {CardProps} from "client/components/station/CardProps";
import {
  FC,
  Fragment,
  Suspense,
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";
import {Canvas, useThree} from "react-three-fiber";
import Button from "client/components/ui/button";
import {ZoomSlider} from "client/components/core/ZoomSlider";
import {useClientData} from "client/components/clientLobby/ClientContext";
import {ApolloProvider, useApolloClient} from "@apollo/client";
import {CircleGrid} from "./CircleGrid";
import {Spacer} from "client/helpers/spacer";
import useLocalStorage from "client/helpers/hooks/useLocalStorage";
import {
  usePlayerForwardVelocitySubscription,
  usePlayerImpulseSubscription,
  usePlayerSetImpulseMutation,
} from "client/generated/graphql";
import {Thrusters} from "./ThrusterJoysticks";
import {useTranslation} from "react-i18next";
import {css} from "@emotion/core";
import {useSpring, animated as a} from "react-spring";
import {useDrag} from "react-use-gesture";
import throttle from "lodash.throttle";
import useMeasure from "client/helpers/hooks/useMeasure";

// Both of these are in kilometers
const zoomMax = 11000;
const zoomMin = 0.011;

const CameraEffects = ({
  zoomValue = 1,
  setDimensions,
}: {
  zoomValue: number;
  setDimensions: (param: {width: number; height: number}) => void;
}) => {
  const {camera, size} = useThree();
  useEffect(() => {
    setDimensions({width: size.width, height: size.height});
  }, [size, setDimensions]);
  useEffect(() => {
    // @ts-ignore
    camera.zoom = zoomValue;
    camera.updateProjectionMatrix();
  }, [zoomValue, camera]);
  return null;
};

const ForwardVelocity = () => {
  const {data: velocityData} = usePlayerForwardVelocitySubscription();
  const ship = velocityData?.playerShipHot;
  if (!ship) return null;
  return (
    <div className="forward-velocity text-2xl w-full p-2 text-center bg-blackAlpha-500 border-2 border-whiteAlpha-500 rounded">
      <div>Forward Velocity:</div>
      <div className="font-bold text-4xl m-2 tabular-nums">
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
const Impulse = () => {
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
    throttle((speed: number) => setImpulse({variables: {speed}}))
  );
  const targetSpeed = impulse?.impulseEngines.targetSpeed || 0;
  const cruisingSpeed = impulse?.impulseEngines.cruisingSpeed || 1;
  const emergencySpeed = impulse?.impulseEngines.emergencySpeed || 1;
  const bind = useDrag(
    ({down, first, offset: [_, y]}) => {
      downRef.current = down;
      if (first) {
        getMeasurements();
      }
      set({
        y,
        immediate: down,
      });
      const normalizedValue = Math.min(
        1,
        Math.abs(1 - y) / (measurement.height - KNOB_HEIGHT)
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
      initial: {y: y.get()},
    }
  );

  useEffect(() => {
    if (downRef.current) return;
    set({
      y:
        (targetSpeed / cruisingSpeed <= 1
          ? (targetSpeed / cruisingSpeed) * BUTTON_OFFSET
          : BUTTON_OFFSET +
            ((targetSpeed - cruisingSpeed) / (emergencySpeed - cruisingSpeed)) *
              (1 - BUTTON_OFFSET)) *
        (-measurement.height + KNOB_HEIGHT),
    });
  }, [targetSpeed, cruisingSpeed, emergencySpeed, set, measurement.height]);
  if (!impulse) return null;
  return (
    <div className="select-none flex-1">
      <div>
        <ForwardVelocity />
        <div className="target-velocity text-2xl w-full p-2 text-center bg-blackAlpha-500 border-2 border-whiteAlpha-500 rounded mt-4">
          <div>Target Velocity:</div>

          <p className="font-bold text-4xl m-2 tabular-nums">
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

const Pilot: FC<CardProps> = ({cardLoaded}) => {
  const {ship} = useClientData();
  const [tilt, setTilt] = useState(0);
  // TODO: Replace with flight localstorage
  const [zoomValue, setZoomValue] = useLocalStorage("thorium_pilot_zoom", 100);
  const [dimensions, setDimensions] = useState({width: 0, height: 0});
  const client = useApolloClient();
  const {t} = useTranslation();
  return (
    <div className="card-pilot h-full grid grid-cols-4 gap-4">
      <div className="flex flex-col mb-6">
        <Impulse />
        <div
          css={css`
            input[type="range"]::-webkit-slider-thumb {
              -webkit-appearance: none;

              height: 2.5rem;
              width: 2.5rem;
              border-radius: 9999px;
              border: 2px solid rgba(0, 0, 0, 0.36);
              --tw-bg-opacity: 1;
              background-color: rgba(107, 114, 128, var(--tw-bg-opacity));

              margin-top: 0px;
              cursor: pointer;
              /* You need to specify a margin in Chrome, but in Firefox and IE it is automatic */
              --tw-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1),
                0 2px 4px -1px rgba(0, 0, 0, 0.06);
              box-shadow: var(--tw-ring-offset-shadow, 0 0 #0000),
                var(--tw-ring-shadow, 0 0 #0000), var(--tw-shadow);
            }
            input[type="range"]::-webkit-slider-runnable-track {
              width: 100%;
              height: calc(2.5rem + 4px);
              cursor: pointer;
              box-shadow: 1px 1px 1px #000000, 0px 0px 1px #0d0d0d;
              background: rgba(0, 0, 0, 0.36);
              border-radius: 9999px;
              border: 2px rgba(255, 255, 255, 0.36) solid;
            }

            input[type="range"]:focus::-webkit-slider-runnable-track {
              background: rgba(255, 255, 255, 0.05);
            }
          `}
        >
          <p className="text-xl">Zoom:</p>
          <ZoomSlider
            value={zoomValue}
            setValue={setZoomValue}
            zoomMin={dimensions.width / (zoomMax * 2)}
            zoomMax={dimensions.width / (zoomMin * 2)}
            step={0.01}
          />
        </div>
        <Button
          size="lg"
          className="w-full"
          onClick={() => setTilt(t => (t == 0 ? 0.5 : t === 0.5 ? 1 : 0))}
        >
          {t("Tilt Sensor View")}
        </Button>
      </div>
      <div className="h-full col-start-2 col-end-4 flex items-center justify-center">
        <div className="h-full relative">
          <div className="absolute h-full w-full">
            <div className="absolute h-full w-full t-0 l-0 border-2 border-whiteAlpha-50 rounded-full bg-blackAlpha-500"></div>
            {cardLoaded && (
              <Canvas
                camera={{
                  position: [0, 100000, 0],
                  far: 200000,
                  zoom: 165,
                }}
                className="rounded-full"
                orthographic
              >
                <CameraEffects
                  zoomValue={zoomValue}
                  setDimensions={setDimensions}
                />
                <Suspense fallback={null}>
                  <ApolloProvider client={client}>
                    <CircleGrid
                      tilt={tilt}
                      playerShipId={ship.id}
                      zoomMax={zoomMax}
                    />
                  </ApolloProvider>
                </Suspense>
              </Canvas>
            )}
          </div>
          <Spacer />
        </div>
      </div>
      <Thrusters />
    </div>
  );
};

export default Pilot;
