import * as React from "react";
import Menubar from "@thorium/ui/Menubar";
import {useMatch, useParams, Route, Routes} from "react-router-dom";
import {useThree} from "@react-three/fiber";
import {forwardRef, useImperativeHandle, useRef} from "react";
import {useStarmapStore} from "client/src/components/Starmap/starmapStore";
import {lightMinuteToLightYear} from "server/src/utils/unitTypes";

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
import SystemMarker from "client/src/components/Starmap/SystemMarker";
import {useNetRequest} from "client/src/context/useNetRequest";
import {netSend} from "client/src/context/netSend";
import StarmapCanvas from "client/src/components/Starmap/StarmapCanvas";
function useSystemId() {
  const match = useMatch("/config/:pluginId/starmap/:systemId");
  const matchSystemId = match?.params.systemId || null;
  return matchSystemId;
}

interface SceneRef {
  camera: () => Camera;
}

function InterstellarPaletteWrapper() {
  const {pluginId} = useParams() as {
    pluginId: string;
  };

  const selectedObjectId = useStarmapStore(s => s.selectedObjectId);

  const stars = useNetRequest("pluginSolarSystems", {pluginId});

  const selectedStar = stars.find(s => s.name === selectedObjectId);

  const update = React.useCallback(
    async (params: {name?: string; description?: string}) => {
      if (!selectedObjectId || typeof selectedObjectId === "number") return;
      const result = await netSend("pluginSolarSystemUpdate", {
        pluginId,
        solarSystemId: selectedObjectId,
        ...params,
      });
      if (params.name) {
        useStarmapStore.setState({selectedObjectId: result.solarSystemId});
      }
    },
    [pluginId, selectedObjectId]
  );
  if (!selectedStar) return null;
  return <InterstellarPalette selectedStar={selectedStar} update={update} />;
}
export default function StarMap() {
  const {pluginId} = useParams() as {
    pluginId: string;
  };

  const selectedObjectId = useStarmapStore(s => s.selectedObjectId);

  const sceneRef = useRef<SceneRef>();

  const systemId = useSystemId();

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
        {systemId ? <SolarSystemPalette /> : <InterstellarPaletteWrapper />}
      </EditorPalette>
      <div className="h-[calc(100%-2rem)]  relative bg-black">
        <StarmapCanvas>
          <StarmapScene ref={sceneRef} />
        </StarmapCanvas>

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
        <Route path="*" element={<InterstellarWrapper />} />
      </Routes>
      <Nebula />
    </>
  );
});

function InterstellarWrapper() {
  const {pluginId} = useParams() as {
    pluginId: string;
  };

  const stars = useNetRequest("pluginSolarSystems", {pluginId});
  return (
    <InterstellarMap>
      {stars.map(star => (
        <SystemMarker
          key={star.name}
          systemId={star.name}
          position={Object.values(star.position) as [number, number, number]}
          name={star.name}
          draggable
        />
      ))}
    </InterstellarMap>
  );
}
