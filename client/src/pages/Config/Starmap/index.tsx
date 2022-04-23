import * as React from "react";
import Menubar from "@thorium/ui/Menubar";
import {
  useMatch,
  useParams,
  UNSAFE_LocationContext,
  UNSAFE_NavigationContext,
  UNSAFE_RouteContext,
  Route,
  Routes,
} from "react-router-dom";
import {Canvas, useThree} from "@react-three/fiber";
import {forwardRef, useImperativeHandle, useRef} from "react";
import {useContextBridge} from "@react-three/drei";
import {useStarmapStore} from "client/src/components/Starmap/starmapStore";
import {ThoriumContext} from "client/src/context/ThoriumContext";
import {lightMinuteToLightYear} from "server/src/utils/unitTypes";

import {useQueryClient, QueryClientProvider} from "react-query";
import {
  InterstellarMap,
  InterstellarMenuButtons,
} from "client/src/components/Starmap/InterstellarMap";
import {Camera} from "three";
import {
  SolarSystemMap,
  SolarSystemMenuButtons,
} from "client/src/components/Starmap/SolarSystemMap";
import {EditorPalette} from "client/src/components/ui/EditorPalette";
import {InterstellarPalette} from "client/src/components/Starmap/InterstellarMap";
import {SolarSystemPalette} from "client/src/components/Starmap/SolarSystemMap";
import Nebula from "client/src/components/Starmap/Nebula";

const FAR = 1e27;

function useSystemId() {
  const match = useMatch("/config/:pluginId/starmap/:systemId");
  const matchSystemId = match?.params.systemId || null;
  return matchSystemId;
}

interface SceneRef {
  camera: () => Camera;
}

export default function StarMap() {
  const {pluginId} = useParams() as {
    pluginId: string;
  };

  const selectedObjectId = useStarmapStore(s => s.selectedObjectId);

  const sceneRef = useRef<SceneRef>();

  const systemId = useSystemId();

  const client = useQueryClient();

  const ContextBridge = useContextBridge(ThoriumContext);
  const Location = useContextBridge(UNSAFE_LocationContext);
  const Navigation = useContextBridge(UNSAFE_NavigationContext);
  const RouteContext = useContextBridge(UNSAFE_RouteContext);
  return (
    <div className="h-full">
      <Menubar
        backTo={
          systemId ? `/config/${pluginId}/starmap` : `/config/${pluginId}/list`
        }
      >
        {!systemId && <InterstellarMenuButtons sceneRef={sceneRef} />}
        {systemId && <SolarSystemMenuButtons sceneRef={sceneRef} />}
      </Menubar>
      <EditorPalette
        isOpen={!!selectedObjectId}
        onClose={() => useStarmapStore.setState({selectedObjectId: null})}
      >
        {systemId ? <SolarSystemPalette /> : <InterstellarPalette />}
      </EditorPalette>
      <div className="h-[calc(100%-2rem)]  relative bg-black">
        <Canvas
          onContextMenu={e => {
            e.preventDefault();
          }}
          gl={{antialias: true, logarithmicDepthBuffer: true}}
          camera={{fov: 45, far: FAR}}
          mode="concurrent"
        >
          <Navigation>
            <Location>
              <RouteContext>
                <ContextBridge>
                  <QueryClientProvider client={client}>
                    <StarmapScene ref={sceneRef} />
                  </QueryClientProvider>
                </ContextBridge>
              </RouteContext>
            </Location>
          </Navigation>
        </Canvas>
        <StatusBar />
      </div>
    </div>
  );
}

function StatusBar() {
  const hoveredPosition = useStarmapStore(s => s.hoveredPosition);
  return (
    <div className="absolute bottom-0 w-full text-white z-20 flex justify-end">
      {hoveredPosition && (
        <span>
          {Math.round(lightMinuteToLightYear(hoveredPosition[0]) * 100) / 100},{" "}
          {Math.round(lightMinuteToLightYear(hoveredPosition[1]) * 100) / 100},{" "}
          {Math.round(lightMinuteToLightYear(hoveredPosition[2]) * 100) / 100}
        </span>
      )}
    </div>
  );
}

const StarmapScene = forwardRef(function StarmapScene(props, ref) {
  const {camera} = useThree();
  useImperativeHandle(ref, () => ({
    camera: () => {
      return camera;
    },
  }));

  return (
    <>
      <ambientLight intensity={0.2} />
      <pointLight position={[10, 10, 10]} />
      <Routes>
        <Route path="/:systemId" element={<SolarSystemMap />} />
        <Route path="*" element={<InterstellarMap />} />
      </Routes>
      <Nebula />
    </>
  );
});
