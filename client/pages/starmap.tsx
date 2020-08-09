import {ApolloProvider, useApolloClient} from "@apollo/client";
import {configStoreApi} from "../components/starmap/configStore";
import React, {Suspense} from "react";
import {BrowserRouter} from "react-router-dom";
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
  const client = useApolloClient();
  return (
    <Suspense fallback={null}>
      <Canvas
        onContextMenu={e => {
          e.preventDefault();
        }}
        sRGB={true}
        gl={{antialias: true, logarithmicDepthBuffer: true, alpha: false}}
        camera={{fov: 45, far: FAR}}
        concurrent
        onPointerMissed={() => {
          configStoreApi.setState({selectedObject: null});
        }}
      >
        <BrowserRouter>
          <ApolloProvider client={client}>
            <Scene ref={sceneRef} />
          </ApolloProvider>
        </BrowserRouter>
      </Canvas>
      <Menubar sceneRef={sceneRef} />
    </Suspense>
  );
};

export default Starmap;
