import React, {Suspense} from "react";
import {Canvas, useFrame, useThree} from "react-three-fiber";
import {ApolloProvider, useApolloClient} from "@apollo/client";
import Nebula from "../starmap/Nebula";
import {useUniverseSystemSubscription} from "../../generated/graphql";
import {configStoreApi, useConfigStore} from "../starmap/configStore";
import StarEntity from "../starmap/entities/StarEntity";
import PlanetEntity from "../starmap/entities/PlanetEntity";
import {getOrbitPosition} from "../starmap/utils";
import {FlyControls, useGLTFLoader} from "drei";
import {useSystemShips, useShipsStore} from "../viewscreen/useSystemShips";
import {whiteImage} from "../viewscreen/whiteImage";
import {
  Camera,
  Color,
  DoubleSide,
  FrontSide,
  Group,
  Mesh,
  MeshStandardMaterial,
  MOUSE,
  Object3D,
  PerspectiveCamera,
  Plane,
  Vector3,
} from "three";
import {ErrorBoundary} from "react-error-boundary";
import {css} from "@emotion/core";
import Button from "../ui/button";
import {FaArrowLeft} from "react-icons/fa";
import {OrbitControls} from "./OrbitControls";
import ShipEntity from "../starmap/entities/ShipEntity";
import useDragSelect from "../../helpers/hooks/useDragSelect";
import styled from "@emotion/styled";
import create from "zustand";
import {getSelectedObjects} from "./dragSelection";
import {useSelectedShips} from "../viewscreen/useSelectedShips";
const FAR = 1e27;

const StarmapCorePlanetary: React.FC = () => {
  const systemId = useConfigStore(store => store.systemId);
  React.useEffect(() => {
    configStoreApi.setState({systemId: "ew1d9kfkfhc49g2", viewingMode: "core"});
  }, []);

  const {data} = useUniverseSystemSubscription({
    variables: {systemId},
    skip: !systemId,
  });
  const system = data?.universeSystem;

  const skyboxKey = system?.planetarySystem?.skyboxKey || "blank";
  React.useEffect(() => {
    configStoreApi.setState({skyboxKey});
  }, [skyboxKey]);
  const ids = useSystemShips();

  return (
    <>
      {system?.items.map(e => {
        if (e.isStar) {
          return <StarEntity key={e.id} entity={e} />;
        }
        if (e.isPlanet) {
          return <PlanetEntity key={e.id} entity={e} />;
        }
        return null;
      })}
      {ids.map(shipId => (
        <Suspense key={shipId} fallback={null}>
          <ErrorBoundary
            FallbackComponent={() => <></>}
            onError={err => console.error(err)}
          >
            <ShipEntity entityId={shipId} />
          </ErrorBoundary>
        </Suspense>
      ))}
    </>
  );
};
const StarmapCoreMenubar: React.FC = () => {
  const systemId = useConfigStore(store => store.systemId);
  const setSystemId = useConfigStore(store => store.setSystemId);
  return (
    <div
      className="fixed top-0 left-0 w-screen p-2 pointer-events-none"
      css={css`
        * {
          pointer-events: all;
        }
      `}
    >
      <div className="flex gap-2 pointer-events-none">
        {systemId && (
          <Button
            variant="ghost"
            variantColor="info"
            size="sm"
            onClick={() => setSystemId("")}
          >
            <FaArrowLeft />
          </Button>
        )}
      </div>
    </div>
  );
};
const CAMERA_Y = 30000000;
const distanceVector = new Vector3();
const StarmapCoreScene: React.FC = () => {
  const systemId = useConfigStore(store => store.systemId);
  const setSystemId = useConfigStore(store => store.setSystemId);
  const {camera, mouse} = useThree();
  const controls = React.useRef<OrbitControls>();
  React.useEffect(() => {
    camera.position.set(0, CAMERA_Y, 0);
    controls.current?.saveState?.();
    configStoreApi.setState({systemId: "ew1d9kfkfhc49g2", viewingMode: "core"});
  }, []);
  useFrame(({camera}) => {
    const distance = camera.position.distanceTo(
      distanceVector.set(camera.position.x, 0, camera.position.z)
    );
    useConfigStore.setState({
      cameraVerticalDistance: distance,
    });
  });
  return (
    <>
      <ambientLight intensity={0.2} />
      <pointLight position={[10, 10, 10]} />
      <OrbitControls
        ref={controls}
        enableRotate={false}
        zoomToCursor
        minZoom={300000000}
        maxPolarAngle={Math.PI / 3}
        mouseButtons={{
          LEFT: MOUSE.LEFT,
          MIDDLE: MOUSE.DOLLY,
          RIGHT: MOUSE.PAN,
        }}
      />
      {systemId && <StarmapCorePlanetary />}
      <Suspense fallback={null}>
        <Nebula />
      </Suspense>
    </>
  );
};
const Distance = React.memo(() => {
  const cameraDistance = useConfigStore(store => store.cameraVerticalDistance);
  return (
    <div className="fixed top-0 left-0 text-white z-50">
      Distance: {cameraDistance}
    </div>
  );
});
const DragSelection = styled.div<{
  width: number;
  height: number;
  x: number;
  y: number;
}>`
  position: absolute;
  background: rgba(0, 142, 226, 0.1);
  border: 1px solid #008ee2;
  width: 20px;
  height: 20px;
  transform: translate(${({x}) => x}px, ${({y}) => y}px);
  width: ${({width}) => width}px;
  height: ${({height}) => height}px;
  left: 0;
  top: 0;
`;

const startPoint = new Vector3();
const endPoint = new Vector3();

const StarmapCore: React.FC = () => {
  const client = useApolloClient();
  const cameraRef = React.useRef<PerspectiveCamera>();

  const [ref, dragPosition] = useDragSelect<HTMLCanvasElement>(
    ({x1, x2, y1, y2}) => {
      const ships = Object.values(useShipsStore.getState());
      if (cameraRef.current) {
        const selectedIds = getSelectedObjects(
          ships,
          cameraRef.current,
          startPoint.set(x1 * 2 - 1, -(y1 * 2 - 1), 0.5),
          endPoint.set(x2 * 2 - 1, -(y2 * 2 - 1), 0.5)
        );
        useSelectedShips.setState({selectedIds});
      }
    }
  );
  return (
    <Suspense fallback={null}>
      <Canvas
        onContextMenu={e => {
          e.preventDefault();
          e.stopPropagation();
        }}
        gl={{antialias: true, logarithmicDepthBuffer: true, alpha: false}}
        camera={{fov: 45, near: 0.01, far: FAR}}
        concurrent
        onCreated={({gl, camera}) => {
          ref(gl.domElement);
          cameraRef.current = camera as PerspectiveCamera;
        }}
      >
        <ApolloProvider client={client}>
          <Suspense fallback={null}>
            <StarmapCoreScene />
          </Suspense>
        </ApolloProvider>
      </Canvas>
      <Distance />
      <StarmapCoreMenubar />
      {dragPosition && <DragSelection {...dragPosition}></DragSelection>}
    </Suspense>
  );
};

export default StarmapCore;
