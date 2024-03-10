import {InterstellarMenuButtons} from "@client/components/Starmap/InterstellarMap";
import {
  SolarSystemMenuButtons,
  SolarSystemPalette,
} from "@client/components/Starmap/SolarSystemMap";
import {useGetStarmapStore} from "@client/components/Starmap/starmapStore";
import {Outlet, useMatch, useParams} from "@remix-run/react";
import {EditorPalette} from "@thorium/ui/EditorPalette";
import {useMenubar} from "@thorium/ui/Menubar";
import {
  Suspense,
  forwardRef,
  useEffect,
  useImperativeHandle,
  useRef,
} from "react";
import type {Camera} from "three";
import {lightMinuteToLightYear} from "@server/utils/unitTypes";
import Nebula from "@client/components/Starmap/Nebula";
import {useThree} from "@react-three/fiber";
import StarmapCanvas from "@client/components/Starmap/StarmapCanvas";
import {ClientOnly} from "remix-utils/client-only";
import {InterstellarPalette} from "@client/components/Starmap/InterstellarMap";
import {q} from "@client/context/AppContext";
import {useCallback} from "react";

interface SceneRef {
  camera: () => Camera;
}

function useSystemId() {
  const match = useMatch("/config/:pluginId/starmap/:systemId");
  const matchSystemId = match?.params.systemId || null;
  return matchSystemId;
}

export default function StarMap() {
  const useStarmapStore = useGetStarmapStore();

  const {pluginId} = useParams() as {
    pluginId: string;
  };

  useEffect(() => {
    useStarmapStore.getState().setCameraControlsEnabled(true);
    useStarmapStore.setState({
      viewingMode: "editor",
    });
  }, [useStarmapStore]);

  const selectedObjectIds = useStarmapStore(s => s.selectedObjectIds);

  const sceneRef = useRef<SceneRef>();

  const systemId = useSystemId();

  useMenubar({
    backTo: systemId
      ? `/config/${pluginId}/starmap`
      : `/config/${pluginId}/list`,
    children: (
      <>
        {!systemId && <InterstellarMenuButtons sceneRef={sceneRef} />}
        {systemId && <SolarSystemMenuButtons sceneRef={sceneRef} />}
      </>
    ),
  });
  return (
    <div className="h-full">
      <EditorPalette
        isOpen={selectedObjectIds.length > 0}
        onClose={() => useStarmapStore.setState({selectedObjectIds: []})}
      >
        <Suspense fallback={null}>
          {systemId ? <SolarSystemPalette /> : <InterstellarPaletteWrapper />}
        </Suspense>
      </EditorPalette>
      <div className="h-[calc(100%-2rem)]  relative bg-black">
        <Suspense fallback={null}>
          <StarmapCanvas>
            <StarmapScene ref={sceneRef} />
          </StarmapCanvas>
        </Suspense>

        <StatusBar />
      </div>
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
      <Suspense fallback={null}>
        <Outlet />
        <ClientOnly>{() => <Nebula />}</ClientOnly>
      </Suspense>
    </>
  );
});

export function StatusBar() {
  const useStarmapStore = useGetStarmapStore();

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

export function InterstellarPaletteWrapper() {
  const useStarmapStore = useGetStarmapStore();

  const {pluginId} = useParams() as {
    pluginId: string;
  };

  const selectedObjectIds = useStarmapStore(s => s.selectedObjectIds);

  const [stars] = q.plugin.starmap.all.useNetRequest({pluginId});

  const selectedStar = stars.find(s => selectedObjectIds?.includes(s.name));

  const update = useCallback(
    async (params: {name?: string; description?: string}) => {
      if (
        !selectedObjectIds?.length ||
        selectedObjectIds.length > 1 ||
        typeof selectedObjectIds[0] === "number"
      )
        return;
      const result = await q.plugin.starmap.solarSystem.update.netSend({
        pluginId,
        solarSystemId: selectedObjectIds[0],
        ...params,
      });
      if (params.name) {
        useStarmapStore.setState({selectedObjectIds: [result.solarSystemId]});
      }
    },
    [pluginId, selectedObjectIds, useStarmapStore]
  );
  if (!selectedStar) return null;
  return <InterstellarPalette selectedStar={selectedStar} update={update} />;
}
