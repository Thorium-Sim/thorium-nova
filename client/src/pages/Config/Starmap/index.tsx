import Menubar from "@thorium/ui/Menubar";
import {useMatch, useNavigate, useParams} from "react-router-dom";
import {Canvas, useFrame, useThree} from "@react-three/fiber";
import {
  forwardRef,
  useImperativeHandle,
  useRef,
  Suspense,
  useEffect,
  useState,
} from "react";
import {Camera, MOUSE, Vector3} from "three";
import {OrbitControls, useContextBridge} from "@react-three/drei";
import {useStarmapStore} from "client/src/components/Starmap/starmapStore";
import {useNetRequest} from "client/src/context/useNetRequest";
import {ThoriumContext} from "client/src/context/ThoriumContext";
import SystemMarker from "client/src/components/Starmap/SystemMarker";
import Button from "@thorium/ui/Button";
import {
  lightMinuteToLightYear,
  LightYear,
  lightYearToLightMinute,
} from "server/src/utils/unitTypes";
import {netSend} from "client/src/context/netSend";
import {toast} from "client/src/context/ToastContext";
import {useConfirm} from "@thorium/ui/AlertDialog";

const FAR = 1e27;

interface SceneRef {
  camera: () => Camera;
}

function useSynchronizeSystemId() {
  const {pluginId} = useParams() as {
    pluginId: string;
  };
  const navigate = useNavigate();
  const systemId = useStarmapStore(store => store.systemId) || null;
  const match = useMatch("/config/:pluginId/starmap/:systemId");
  const matchSystemId = match?.params.systemId || null;
  const [storedSystemId, setStoredSystemId] = useState(matchSystemId);
  let mounted = useRef(false);
  useEffect(() => {
    if (!mounted.current) return;
    setStoredSystemId(matchSystemId);
  }, [matchSystemId]);
  useEffect(() => {
    if (!mounted.current) return;
    setStoredSystemId(systemId);
  }, [systemId]);
  useEffect(() => {
    if (storedSystemId) {
      navigate(`/config/${pluginId}/starmap/${storedSystemId}`);
      useStarmapStore.setState({systemId: storedSystemId});
    } else {
      navigate(`/config/${pluginId}/starmap`);
      useStarmapStore.setState({systemId: null});
    }
  }, [storedSystemId]);
  useEffect(() => {
    mounted.current = true;
  }, []);

  return storedSystemId;
}
export default function StarMap() {
  const {pluginId} = useParams() as {
    pluginId: string;
  };

  const sceneRef = useRef<SceneRef>();

  useEffect(() => {
    useStarmapStore.setState({pluginId});
    return () => useStarmapStore.setState({pluginId: null});
  }, [pluginId]);

  const systemId = useSynchronizeSystemId();

  const ContextBridge = useContextBridge(ThoriumContext);
  const selectedObjectId = useStarmapStore(s => s.selectedObjectId);

  const confirm = useConfirm();
  async function deleteObject() {
    const selectedObjectId = useStarmapStore.getState().selectedObjectId;
    if (!selectedObjectId) return;

    const doRemove = await confirm({
      header: "Are you sure you want to remove this object?",
      body: "It will remove all of the objects inside of it.",
    });
    if (!doRemove) return;

    await netSend("pluginSolarSystemDelete", {
      pluginId,
      solarSystemId: selectedObjectId,
    });

    useStarmapStore.setState({
      selectedObjectId: null,
    });
  }

  return (
    <div className="h-full">
      <Menubar
        backTo={
          systemId ? `/config/${pluginId}/starmap` : `/config/${pluginId}/list`
        }
      >
        <Button
          className="btn-success btn-outline btn-xs"
          onClick={async () => {
            const camera = sceneRef.current?.camera();
            if (!camera) return;
            const vec = new Vector3(0, 0, lightYearToLightMinute(-300));

            vec.applyQuaternion(camera.quaternion).add(camera.position);
            console.log(vec);
            const system = await netSend("pluginSolarSystemCreate", {
              pluginId,
              position: vec,
            });
            if ("error" in system) {
              toast({
                title: "Error creating system",
                body: system.error,
                color: "error",
              });
              return;
            }
            useStarmapStore.setState({selectedObjectId: system.solarSystemId});
          }}
        >
          Add
        </Button>
        <Button
          className="btn-error btn-outline btn-xs"
          disabled={!selectedObjectId}
          onClick={deleteObject}
        >
          Delete
        </Button>
        <Button
          className="btn-primary btn-outline btn-xs"
          disabled={!selectedObjectId}
        >
          Edit
        </Button>
      </Menubar>
      <div className="h-[calc(100%-2rem)]  relative">
        <Canvas
          onContextMenu={e => {
            e.preventDefault();
          }}
          gl={{antialias: true, logarithmicDepthBuffer: true, alpha: false}}
          camera={{fov: 45, far: FAR}}
          mode="concurrent"
        >
          <ContextBridge>
            <StarmapScene ref={sceneRef} />
          </ContextBridge>
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

const INTERSTELLAR_MAX_DISTANCE: LightYear = 2000;

function InterstellarMap() {
  const pluginId = useStarmapStore(s => s.pluginId as string);

  const stars = useNetRequest("pluginSolarSystems", {pluginId});
  const controlsEnabled = useStarmapStore(s => s.cameraControlsEnabled);

  const orbitControls = useRef<any>();
  const {camera} = useThree();
  useEffect(() => {
    // Set the initial camera position
    camera.position.setY(lightYearToLightMinute(INTERSTELLAR_MAX_DISTANCE) / 2);
    camera.position.setZ(0);
    camera.position.setX(0);
    camera.lookAt(0, 0, 0);
  }, [camera]);

  return (
    <Suspense fallback={null}>
      <OrbitControls
        ref={orbitControls}
        enabled={controlsEnabled}
        maxDistance={lightYearToLightMinute(INTERSTELLAR_MAX_DISTANCE)}
        minDistance={1}
        mouseButtons={{
          LEFT: MOUSE.ROTATE,
          RIGHT: MOUSE.PAN,
          MIDDLE: MOUSE.DOLLY,
        }}
      />

      {stars.map(star => (
        <SystemMarker
          key={star.name}
          systemId={star.name}
          position={Object.values(star.position) as [number, number, number]}
          name={star.name}
          draggable
        />
      ))}
    </Suspense>
  );
}
function SolarSystemMap() {
  return (
    <mesh rotation={[Math.PI / 3, Math.PI / 5, 0]}>
      <meshLambertMaterial attach="material" color="blue" />
      <boxGeometry attach="geometry" args={[1, 1, 1]} />
    </mesh>
  );
}

const StarmapScene = forwardRef((props, ref) => {
  const pluginId = useStarmapStore(s => s.pluginId);
  const systemId = useStarmapStore(s => s.systemId);

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
