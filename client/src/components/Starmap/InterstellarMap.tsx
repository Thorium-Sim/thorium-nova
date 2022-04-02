import * as React from "react";
import {useParams} from "react-router-dom";
import {useThree} from "@react-three/fiber";
import {useRef, Suspense, useEffect} from "react";
import {Camera, MOUSE, Plane, Vector2, Vector3} from "three";
import {OrbitControls} from "@react-three/drei";
import {useStarmapStore} from "client/src/components/Starmap/starmapStore";
import {useNetRequest} from "client/src/context/useNetRequest";
import SystemMarker from "client/src/components/Starmap/SystemMarker";
import Starfield from "client/src/components/Starmap/Starfield";
import {LightYear, lightYearToLightMinute} from "server/src/utils/unitTypes";
import {toast} from "client/src/context/ToastContext";
import {netSend} from "client/src/context/netSend";
import {useConfirm} from "@thorium/ui/AlertDialog";
import Button from "@thorium/ui/Button";

const INTERSTELLAR_MAX_DISTANCE: LightYear = 2000;
const Y_PLANE = new Plane(new Vector3(0, 1, 0), 0);

export function InterstellarMap() {
  const {pluginId} = useParams() as {
    pluginId: string;
  };

  const stars = useNetRequest("pluginSolarSystems", {pluginId});
  const controlsEnabled = useStarmapStore(s => s.cameraControlsEnabled);
  const cameraView = useStarmapStore(s => s.cameraView);
  const orbitControls = useRef<any>();
  const {camera, raycaster, size} = useThree();
  useEffect(() => {
    // Set the initial camera position
    camera.position.setY(lightYearToLightMinute(INTERSTELLAR_MAX_DISTANCE) / 2);
    camera.position.setZ(0);
    camera.position.setX(0);
    camera.lookAt(0, 0, 0);
  }, [camera]);

  useEffect(() => {
    raycaster.setFromCamera(new Vector2(0, 0), camera);
    const intersects = new Vector3();
    raycaster.ray.intersectPlane(Y_PLANE, intersects);
    camera.position.set(intersects.x, camera.position.y, intersects.z);
    orbitControls.current.target.set(intersects.x, intersects.y, intersects.z);
  }, [camera, cameraView, size, raycaster]);

  return (
    <Suspense fallback={null}>
      <Starfield radius={lightYearToLightMinute(INTERSTELLAR_MAX_DISTANCE)} />
      <OrbitControls
        ref={orbitControls}
        enabled={controlsEnabled}
        maxDistance={lightYearToLightMinute(INTERSTELLAR_MAX_DISTANCE)}
        minDistance={1}
        mouseButtons={{
          LEFT: cameraView === "2d" ? MOUSE.PAN : MOUSE.ROTATE,
          RIGHT: MOUSE.PAN,
          MIDDLE: MOUSE.DOLLY,
        }}
      />
      <polarGridHelper
        rotation={[0, (2 * Math.PI) / 12, 0]}
        args={[
          lightYearToLightMinute(INTERSTELLAR_MAX_DISTANCE),
          12,
          20,
          64,
          0x050505,
          0x050505,
        ]}
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

interface SceneRef {
  camera: () => Camera;
}

export function InterstellarMenuButtons({
  sceneRef,
}: {
  sceneRef: React.MutableRefObject<SceneRef | undefined>;
}) {
  const {pluginId} = useParams() as {
    pluginId: string;
  };

  const selectedObjectId = useStarmapStore(s => s.selectedObjectId);
  const cameraView = useStarmapStore(s => s.cameraView);
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
    <>
      <Button
        className="btn-success btn-outline btn-xs"
        onClick={async () => {
          const camera = sceneRef.current?.camera();
          if (!camera) return;
          const vec = new Vector3(0, 0, lightYearToLightMinute(-300));

          vec.applyQuaternion(camera.quaternion).add(camera.position);
          try {
            const system = await netSend("pluginSolarSystemCreate", {
              pluginId,
              position: vec,
            });
            useStarmapStore.setState({
              selectedObjectId: system.solarSystemId,
            });
          } catch (err) {
            if (err instanceof Error) {
              toast({
                title: "Error creating system",
                body: err.message,
                color: "error",
              });
              return;
            }
          }
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
      <Button
        className="btn-notice btn-outline btn-xs"
        onClick={() =>
          useStarmapStore
            .getState()
            .setCameraView(cameraView === "2d" ? "3d" : "2d")
        }
      >
        Go to {cameraView === "2d" ? "3D" : "2D"}
      </Button>
    </>
  );
}
