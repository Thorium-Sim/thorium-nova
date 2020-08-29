import {ApolloProvider, useApolloClient} from "@apollo/client";
import {
  configStoreApi,
  useConfigStore,
} from "../components/starmap/configStore";
import React, {Suspense} from "react";
import {Canvas} from "react-three-fiber";
import {Camera} from "three";
import Menubar from "../components/starmap/Menubar";
import Scene from "../components/starmap/Scene";
import ConfigPalette from "../components/starmap/ConfigPalette";
import {useParams} from "react-router";

const FAR = 1e27;

interface SceneRef {
  camera: () => Camera;
}
const Starmap: React.FC = () => {
  const sceneRef = React.useRef<SceneRef>();
  const client = useApolloClient();
  const {universeId} = useParams();
  const setUniverseId = useConfigStore(s => s.setUniverseId);
  React.useEffect(() => {
    setUniverseId(universeId);
  }, [universeId]);

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
          configStoreApi.setState(state => {
            if (
              state.currentSystem &&
              state.selectedObject !== state.currentSystem
            ) {
              return {
                selectedObject: state.currentSystem,
                selectedPosition: null,
              };
            }
            return {selectedObject: null, selectedPosition: null};
          });
        }}
      >
        <ApolloProvider client={client}>
          <Scene ref={sceneRef} />
        </ApolloProvider>
      </Canvas>
      <Menubar sceneRef={sceneRef} />
      <ConfigPalette />
    </Suspense>
  );
};

export default Starmap;
