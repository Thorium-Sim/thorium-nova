import React, {Suspense, useCallback} from "react";
import {Canvas, useFrame, useThree} from "react-three-fiber";
import {ApolloProvider, useApolloClient} from "@apollo/client";
import Nebula from "../starmap/Nebula";
import {configStoreApi, useConfigStore} from "../starmap/configStore";
import {useSystemShipsStore} from "../viewscreen/useSystemShips";
import {MOUSE, PerspectiveCamera, Vector3} from "three";
import {OrbitControls} from "./OrbitControls";
import useDragSelect from "../../helpers/hooks/useDragSelect";
import styled from "@emotion/styled";
import {getSelectedObjects} from "./dragSelection";
import {useSelectedShips} from "../viewscreen/useSelectedShips";
import {ZoomSlider} from "./ZoomSlider";
import {StarmapCoreMenubar} from "./Menubar";
import {StarmapCorePlanetary} from "./Planetary";
import {CanvasContextMenu} from "./coreContextMenu";
import {useSetupOrbitControls} from "client/helpers/useSetupOrbitControls";
const FAR = 1e27;

const CAMERA_Y = 30000000;
const distanceVector = new Vector3();
const StarmapCoreScene: React.FC = () => {
  const systemId = useConfigStore(store => store.systemId);
  // const setSystemId = useConfigStore(store => store.setSystemId);
  const {camera} = useThree();
  const controls = React.useRef<OrbitControls>();
  React.useEffect(() => {
    camera.position.set(0, CAMERA_Y, 0);
    controls.current?.saveState?.();
    configStoreApi.setState({systemId: "ew1d9kfkfhc49g2", viewingMode: "core"});
  }, [camera]);
  useFrame(({camera}) => {
    const distance = camera.position.distanceTo(
      distanceVector.set(camera.position.x, 0, camera.position.z)
    );
    useConfigStore.setState({
      cameraVerticalDistance: distance,
    });
  });

  useSetupOrbitControls(controls);

  return (
    <>
      <ambientLight intensity={0.2} />
      <pointLight position={[10, 10, 10]} />
      <OrbitControls
        ref={controls}
        enableRotate={false}
        enableKeys={false}
        zoomToCursor
        minDistance={0.5}
        maxDistance={30000000000}
        maxPolarAngle={Math.PI / 3}
        mouseButtons={{
          LEFT: MOUSE.PAN,
          MIDDLE: MOUSE.DOLLY,
          RIGHT: MOUSE.RIGHT,
        }}
      />

      {systemId && <StarmapCorePlanetary />}
      <Suspense fallback={null}>
        <Nebula />
      </Suspense>
    </>
  );
};

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

  const [ref, dragPosition, node] = useDragSelect<HTMLCanvasElement>(
    ({x1, x2, y1, y2}) => {
      const ships = Object.values(useSystemShipsStore.getState());
      if (cameraRef.current) {
        const selectedIds = getSelectedObjects(
          ships.filter(s => s.position) as {
            id: string;
            position: {
              x: number;
              y: number;
              z: number;
            };
          }[],
          cameraRef.current,
          startPoint.set(x1 * 2 - 1, -(y1 * 2 - 1), 0.5),
          endPoint.set(x2 * 2 - 1, -(y2 * 2 - 1), 0.5)
        );
        useSelectedShips.setState({selectedIds});
      }
    }
  );
  const onCreated = useCallback(
    ({gl, camera}) => {
      ref(gl.domElement);
      cameraRef.current = camera as PerspectiveCamera;
    },
    [ref]
  );

  return (
    <Suspense fallback={null}>
      <div className="relative h-full">
        <Canvas
          onContextMenu={e => {
            e.preventDefault();
            e.stopPropagation();
          }}
          onPointerMissed={() => {
            useSelectedShips.setState({selectedIds: [], cachedPositions: {}});
          }}
          gl={{antialias: true, logarithmicDepthBuffer: true, alpha: false}}
          camera={{fov: 45, near: 0.01, far: FAR}}
          concurrent
          onCreated={onCreated}
        >
          <ApolloProvider client={client}>
            <Suspense fallback={null}>
              <StarmapCoreScene />
            </Suspense>
          </ApolloProvider>
        </Canvas>

        <StarmapCoreMenubar
          canvasHeight={node?.height || 0}
          canvasWidth={node?.width || 0}
        />
        <CanvasContextMenu />
        {dragPosition && <DragSelection {...dragPosition}></DragSelection>}
        <ZoomSliderWrapper />
      </div>
    </Suspense>
  );
};

const ZoomSliderWrapper = () => {
  const cameraZoom = useConfigStore(store => store.cameraVerticalDistance);
  return (
    <div
      className={`pointer-events-none absolute bottom-0 right-0 w-64 py-6 px-4`}
    >
      <p>Zoom</p>
      <ZoomSlider
        value={cameraZoom}
        setValue={val =>
          useConfigStore.getState().orbitControlsSet({zoom: val})
        }
      />
    </div>
  );
};
export default StarmapCore;
