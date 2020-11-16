import React, {Suspense} from "react";
import {Canvas, useFrame, useThree} from "react-three-fiber";
import {ApolloProvider, useApolloClient} from "@apollo/client";
import Nebula from "../starmap/Nebula";
import {configStoreApi, useConfigStore} from "../starmap/configStore";
import {useShipsStore} from "../viewscreen/useSystemShips";
import {MOUSE, PerspectiveCamera, Vector3} from "three";
import {OrbitControls} from "./OrbitControls";
import useDragSelect from "../../helpers/hooks/useDragSelect";
import styled from "@emotion/styled";
import {getSelectedObjects} from "./dragSelection";
import {useSelectedShips} from "../viewscreen/useSelectedShips";
import {ZoomSlider} from "./ZoomSlider";
import {StarmapCoreMenubar} from "./Menubar";
import {useTranslate2DTo3D} from "client/helpers/hooks/use2Dto3D";
import {StarmapCorePlanetary} from "./Planetary";
import {CanvasContextMenu} from "./coreContextMenu";
const FAR = 1e27;

const CAMERA_Y = 30000000;
const distanceVector = new Vector3();
const StarmapCoreScene: React.FC = () => {
  const systemId = useConfigStore(store => store.systemId);
  const setSystemId = useConfigStore(store => store.setSystemId);
  const {camera} = useThree();
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
  const to3D = useTranslate2DTo3D();

  React.useEffect(() => {
    useConfigStore.setState({
      translate2dTo3d: to3D,
      disableOrbitControls: () => {
        if (controls.current) {
          controls.current.enabled = false;
        }
      },
      enableOrbitControls: () => {
        if (controls.current) {
          controls.current.enabled = true;
        }
      },
      orbitControlsSet: ({zoom, position}) => {
        if (controls.current) {
          if (zoom) {
            camera.position.y = zoom;
          }
          if (position) {
            camera.position.x = position.x;
            camera.position.z = position.z;
            if (controls.current.target) {
              controls.current.target.x = position.x;
              controls.current.target.y = 0;
              controls.current.target.z = position.z;
            }
          }
          controls.current?.saveState?.();
        }
      },
    });
  }, []);

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
      const ships = Object.values(useShipsStore.getState());
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

  return (
    <Suspense fallback={null}>
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

      <StarmapCoreMenubar
        canvasHeight={node?.height || 0}
        canvasWidth={node?.width || 0}
      />
      <CanvasContextMenu />
      {dragPosition && <DragSelection {...dragPosition}></DragSelection>}
      <ZoomSlider />
    </Suspense>
  );
};

export default StarmapCore;
