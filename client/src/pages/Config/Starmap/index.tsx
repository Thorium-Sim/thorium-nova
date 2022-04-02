import * as React from "react";
import Menubar from "@thorium/ui/Menubar";
import {
  useMatch,
  useParams,
  UNSAFE_LocationContext,
  UNSAFE_NavigationContext,
  UNSAFE_RouteContext,
} from "react-router-dom";
import {Canvas, useThree} from "@react-three/fiber";
import {forwardRef, useImperativeHandle, useRef, useEffect} from "react";
import {useContextBridge} from "@react-three/drei";
import {useStarmapStore} from "client/src/components/Starmap/starmapStore";
import {useNetRequest} from "client/src/context/useNetRequest";
import {ThoriumContext} from "client/src/context/ThoriumContext";
import {lightMinuteToLightYear} from "server/src/utils/unitTypes";
import {netSend} from "client/src/context/netSend";
import {Portal} from "@headlessui/react";
import {useDrag} from "@use-gesture/react";
import {animated} from "@react-spring/web";

import {FaMinus, FaTimes} from "react-icons/fa";
import Input from "@thorium/ui/Input";
import {useLocalStorage} from "client/src/hooks/useLocalStorage";
import debounce from "lodash.debounce";
import {useQueryClient, QueryClientProvider} from "react-query";
import {
  InterstellarMap,
  InterstellarMenuButtons,
} from "../../../components/Starmap/InterstellarMap";
import {Camera} from "three";

const FAR = 1e27;

function useSystemId() {
  const match = useMatch("/config/:pluginId/starmap/:systemId");
  const matchSystemId = match?.params.systemId || null;
  return matchSystemId;
}

function EditorPalette({
  isOpen,
  onClose,
  children,
}: {
  isOpen: boolean;
  onClose: () => void;
  children: React.ReactNode;
}) {
  const [[x, y], setXY] = useLocalStorage("editorPalettePosition", [0, 0]);

  const bind = useDrag(
    ({offset: [x, y]}) => {
      setXY([x, y]);
    },
    {
      from: [x, y],
      filterTaps: true,
    }
  );
  const [minimized, setMinimized] = React.useState(false);

  if (!isOpen) return null;

  return (
    <Portal>
      <animated.div
        className="w-64 max-h-96 bg-gray-900 shadow-lg rounded-lg fixed left-[calc(50%-6rem)] top-[calc(50%-8rem)]"
        style={{
          x,
          y,
        }}
      >
        <div
          className={`w-full h-8 bg-gray-800 text-white font-bold flex items-center justify-between select-none touch-none cursor-grab active:cursor-grabbing rounded-t-lg ${
            minimized ? "rounded-b-lg" : ""
          }`}
          {...bind()}
        >
          <button
            className="p-1 ml-1 rounded-full hover:bg-white/10 cursor-pointer"
            onClick={onClose}
            aria-label="Close"
          >
            <FaTimes />
          </button>
          <span className="flex-1 text-center">Editor</span>
          <button
            className="p-1 mr-1 rounded-full hover:bg-white/10 cursor-pointer"
            onClick={() => setMinimized(s => !s)}
            aria-label="Minimize"
          >
            <FaMinus />
          </button>
        </div>
        {minimized ? null : children}
      </animated.div>
    </Portal>
  );
}

const InterstellarPalette = () => {
  const {pluginId} = useParams() as {
    pluginId: string;
  };
  const selectedObjectId = useStarmapStore(store => store.selectedObjectId);
  const stars = useNetRequest("pluginSolarSystems", {pluginId});

  const selectedStar = stars.find(s => s.name === selectedObjectId);

  useEffect(() => {
    if (!selectedStar) {
      useStarmapStore.setState({selectedObjectId: null});
    }
  }, []);

  const [name, setName] = React.useState(selectedStar?.name || "");
  const [description, setDescription] = React.useState(
    selectedStar?.description || ""
  );

  const update = React.useMemo(
    () =>
      debounce(
        async (params: {name?: string; description?: string}) => {
          if (!selectedObjectId) return;
          const result = await netSend("pluginSolarSystemUpdate", {
            pluginId,
            solarSystemId: selectedObjectId,
            ...params,
          });
          if (params.name) {
            useStarmapStore.setState({selectedObjectId: result.solarSystemId});
          }
        },
        500,
        {maxWait: 2000, trailing: true}
      ),
    [pluginId, selectedObjectId]
  );

  useEffect(() => {
    if (!selectedStar) return;
    setName(selectedStar.name);
    setDescription(selectedStar.description);
  }, [selectedStar?.name, selectedStar?.description]);

  return (
    <div className="w-full h-full overflow-y-auto p-2 text-white">
      <Input
        label="Name"
        value={name}
        onChange={e => {
          setName(e.target.value);
          update({name: e.target.value});
        }}
        name="name"
      />
      <Input
        label="Description"
        as="textarea"
        rows={5}
        className="resize-none"
        value={description}
        onChange={e => {
          setDescription(e.target.value);
          update({description: e.target.value});
        }}
        name="description"
      />
    </div>
  );
};

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
      </Menubar>
      <EditorPalette
        isOpen={!!selectedObjectId}
        onClose={() => useStarmapStore.setState({selectedObjectId: null})}
      >
        {systemId ? null : <InterstellarPalette />}
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

function SolarSystemMap() {
  const {camera} = useThree();

  useEffect(() => {
    camera.position.set(0, 0, 5);
    camera.lookAt(0, 0, 0);
  }, []);
  return (
    <mesh rotation={[Math.PI / 3, Math.PI / 5, 0]}>
      <meshLambertMaterial attach="material" color="blue" />
      <boxGeometry attach="geometry" args={[1, 1, 1]} />
    </mesh>
  );
}

const StarmapScene = forwardRef(function StarmapScene(props, ref) {
  const systemId = useSystemId();
  const {pluginId} = useParams() as {
    pluginId: string;
  };

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
      {pluginId && !systemId && <InterstellarMap />}
      {pluginId && systemId && <SolarSystemMap />}
    </>
  );
});
