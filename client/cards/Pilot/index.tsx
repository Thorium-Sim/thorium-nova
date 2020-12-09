import {CardProps} from "client/components/station/CardProps";
import {FC, useEffect, useState} from "react";
import {Canvas, useThree} from "react-three-fiber";

import {useSpring, animated as a} from "react-spring/three";
import {useSpring as useDomSpring, animated as da} from "react-spring/web";
import Button from "client/components/ui/button";
import {ZoomSlider} from "client/components/core/ZoomSlider";
import {Arrow} from "./PlayerArrow";
import {Circle} from "./DistanceCircle";
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
    // @ts-ignore
    window.camera = camera;
  }, [zoomValue, camera]);
  return null;
};
const Pilot: FC<CardProps> = ({cardLoaded}) => {
  const [tilted, setTilted] = useState(false);
  const [zoomValue, setZoomValue] = useState(100);
  const [dimensions, setDimensions] = useState({width: 0, height: 0});
  const props = useSpring({
    rotation: tilted ? [-Math.PI / 3, 0, 0] : [0, 0, 0],
  });
  const {transform} = useDomSpring({
    transform: `rotateX(${tilted ? 60 : 0}deg)`,
  });
  return (
    <div className="card-pilot h-full grid grid-cols-4 gap-4">
      <div>
        <Button onClick={() => setTilted(t => !t)}>Tilt</Button>

        <ZoomSlider
          value={zoomValue}
          setValue={setZoomValue}
          zoomMin={dimensions.width / (zoomMax * 2)}
          zoomMax={dimensions.width / (zoomMin * 2)}
          step={0.01}
        />
      </div>
      <div className="h-full col-start-2 col-end-4 flex items-center justify-center">
        <div className="h-full relative">
          <div className="absolute h-full w-full">
            <da.div
              className="absolute h-full w-full t-0 l-0 border-2 border-whiteAlpha-50 rounded-full bg-blackAlpha-500"
              style={{transform}}
            ></da.div>
            {cardLoaded && (
              <Canvas
                camera={{
                  position: [0, 0, 100000],
                  far: 200000,
                  zoom: 165.69539006101985,
                }}
                className="rounded-full"
                orthographic
              >
                <CameraEffects
                  zoomValue={zoomValue}
                  setDimensions={setDimensions}
                />
                <ambientLight />
                <pointLight position={[10, 10, 10]} />
                <a.group
                  rotation={
                    (props.rotation as unknown) as [number, number, number]
                  }
                >
                  <Circle tilted={tilted} radius={10000} />
                  <Circle tilted={tilted} radius={7500} />
                  <Circle tilted={tilted} radius={5000} />
                  <Circle tilted={tilted} radius={2500} />
                  <Circle tilted={tilted} radius={1800} />
                  <Circle tilted={tilted} radius={1000} />
                  <Circle tilted={tilted} radius={750} />
                  <Circle tilted={tilted} radius={500} />
                  <Circle tilted={tilted} radius={250} />
                  <Circle tilted={tilted} radius={180} />
                  <Circle tilted={tilted} radius={100} />
                  <Circle tilted={tilted} radius={75} />
                  <Circle tilted={tilted} radius={50} />
                  <Circle tilted={tilted} radius={25} />
                  <Circle tilted={tilted} radius={18} />
                  <Circle tilted={tilted} radius={10} />
                  <Circle tilted={tilted} radius={7.5} />
                  <Circle tilted={tilted} radius={5.0} />
                  <Circle tilted={tilted} radius={2.5} />
                  <Circle tilted={tilted} radius={1.8} />
                  <Circle tilted={tilted} />
                  <Circle tilted={tilted} radius={0.75} />
                  <Circle tilted={tilted} radius={0.5} />
                  <Circle tilted={tilted} radius={0.25} />
                  <Circle tilted={tilted} radius={0.18} />
                  <Circle tilted={tilted} radius={0.1} />
                  <Circle tilted={tilted} radius={0.075} />
                  <Circle tilted={tilted} radius={0.05} />
                  <Circle tilted={tilted} radius={0.025} />
                  <Circle tilted={tilted} radius={0.018} />
                  <Circle tilted={tilted} radius={0.01} />

                  <Arrow />
                </a.group>
              </Canvas>
            )}
          </div>
          <svg
            xmlns="http://www.w3.org/2000/svg"
            height="100"
            width="100"
            className="h-full w-auto"
          />
        </div>
      </div>
    </div>
  );
};

export default Pilot;
