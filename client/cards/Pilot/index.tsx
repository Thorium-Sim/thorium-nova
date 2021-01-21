import {CardProps} from "client/components/station/CardProps";
import {FC, Suspense, useEffect, useState} from "react";
import {Canvas, useThree} from "react-three-fiber";
import Button from "client/components/ui/button";
import {ZoomSlider} from "client/components/core/ZoomSlider";
import {useClientData} from "client/components/clientLobby/ClientContext";
import {ApolloProvider, useApolloClient} from "@apollo/client";
import {CircleGrid} from "./CircleGrid";
import {Spacer} from "client/helpers/spacer";
import useLocalStorage from "client/helpers/hooks/useLocalStorage";
import {Thrusters} from "./ThrusterJoysticks";
import {useTranslation} from "react-i18next";
import {useWheel} from "react-use-gesture";
import {Impulse} from "./ImpulseControls";
import {ZoomStyleWrapper} from "./ZoomStyleWrapper";

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

function logslider(
  zoomMin: number,
  zoomMax: number,
  position: number,
  reverse?: boolean
) {
  // position will be between 0 and 100
  var minP = 0;
  var maxP = 100;

  // The result should be between 100 an 10000000
  var minV = Math.log(zoomMin);
  var maxV = Math.log(zoomMax);

  // calculate adjustment factor
  var scale = (maxV - minV) / (maxP - minP);
  if (reverse) return (Math.log(position) - minV) / scale + minP;
  return Math.exp(minV + scale * (position - minP));
}

const Pilot: FC<CardProps> = ({cardLoaded}) => {
  const {ship} = useClientData();
  const [tilt, setTilt] = useState(0);
  // TODO: Replace with flight localstorage
  const [zoomValue, setZoomValue] = useLocalStorage("thorium_pilot_zoom", 100);
  const [dimensions, setDimensions] = useState({width: 0, height: 0});
  const client = useApolloClient();
  const {t} = useTranslation();
  const wheelBind = useWheel(({delta: [x, y]}) => {
    setZoomValue(v => {
      const min = dimensions.width / (zoomMax * 2);
      const max = dimensions.width / (zoomMin * 2);
      const val = logslider(min, max, v, true) + y / 100;
      const output = Math.max(min, Math.min(max, logslider(min, max, val)));
      return output;
    });
  });
  return (
    <div className="card-pilot h-full grid grid-cols-4 gap-4 select-none">
      <div className="flex flex-col mb-6">
        <Impulse cardLoaded={cardLoaded} />
        <ZoomStyleWrapper>
          <p className="text-xl">Zoom:</p>
          <ZoomSlider
            value={zoomValue}
            setValue={setZoomValue}
            zoomMin={dimensions.width / (zoomMax * 2)}
            zoomMax={dimensions.width / (zoomMin * 2)}
            step={0.01}
          />
        </ZoomStyleWrapper>
        <Button
          size="lg"
          className="w-full"
          onClick={() => setTilt(t => (t == 0 ? 0.5 : t === 0.5 ? 1 : 0))}
        >
          {t("Tilt Sensor View")}
        </Button>
        <Button
          size="lg"
          className="w-full mt-2"
          variantColor="warning"
          onClick={() => {}}
        >
          {t("Lock On Course")}
        </Button>
      </div>
      <div className="h-full col-start-2 col-end-4 flex items-center justify-center">
        <div className="h-full relative">
          <div className="absolute h-full w-full" {...wheelBind()}>
            <div className="absolute h-full w-full t-0 l-0 border-2 border-whiteAlpha-50 rounded-full bg-blackAlpha-500"></div>
            {cardLoaded && (
              <Canvas
                camera={{
                  position: [0, 300000, 0],
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
