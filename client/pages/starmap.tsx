import React, {Suspense} from "react";
import {Canvas} from "react-three-fiber";
import {Camera} from "three";
import Menubar from "../components/starmap/Menubar";
import Scene from "../components/starmap/Scene";

const FAR = 1e27;

interface SceneRef {
  camera: () => Camera;
}
const Starmap: React.FC = () => {
  const sceneRef = React.useRef<SceneRef>();
  return (
    <Suspense fallback={null}>
      <Canvas
        onContextMenu={e => {
          e.preventDefault();
        }}
        sRGB={true}
        gl={{antialias: true, logarithmicDepthBuffer: true}}
        camera={{far: FAR}}
        concurrent
      >
        <Scene ref={sceneRef} />
      </Canvas>
      <Menubar sceneRef={sceneRef} />
    </Suspense>
  );
};

export default Starmap;
