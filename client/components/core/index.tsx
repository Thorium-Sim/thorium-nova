import React, {Suspense} from "react";
import {Canvas, useFrame, useThree} from "react-three-fiber";
import {ApolloProvider, useApolloClient} from "@apollo/client";
import Nebula from "../starmap/Nebula";
import {useUniverseSystemSubscription} from "../../generated/graphql";
import {configStoreApi, useConfigStore} from "../starmap/configStore";
import StarEntity from "../starmap/entities/StarEntity";
import PlanetEntity from "../starmap/entities/PlanetEntity";
import {useSystemShips, useShipsStore} from "../viewscreen/useSystemShips";
import {Event, MOUSE, PerspectiveCamera, Vector3} from "three";
import {ErrorBoundary} from "react-error-boundary";
import {css} from "@emotion/core";
import Button from "../ui/button";
import {FaArrowLeft} from "react-icons/fa";
import {OrbitControls} from "./OrbitControls";
import ShipEntity from "../starmap/entities/ShipEntity";
import useDragSelect from "../../helpers/hooks/useDragSelect";
import styled from "@emotion/styled";
import {getSelectedObjects} from "./dragSelection";
import {useSelectedShips} from "../viewscreen/useSelectedShips";
import Slider from "../ui/Slider";
import {MdCenterFocusWeak} from "react-icons/md";
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
const ZOOM_MARGIN = 400;
const StarmapCoreMenubar: React.FC<{
  canvasHeight: number;
  canvasWidth: number;
}> = ({canvasHeight, canvasWidth}) => {
  const systemId = useConfigStore(store => store.systemId);
  const setSystemId = useConfigStore(store => store.setSystemId);
  const {selectedIds} = useSelectedShips();
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
        <Button
          variant="ghost"
          variantColor="info"
          size="sm"
          disabled={selectedIds.length === 0}
          onClick={() => {
            const ships = useShipsStore.getState();
            const selectedShips = selectedIds.map(id => ships[id]);
            const [center, min, max] = selectedShips.reduce(
              (prev, next, index, arr) => {
                prev[0].x += next.position.x / arr.length;
                prev[0].z += next.position.z / arr.length;

                // min
                prev[1].x =
                  prev[1].x > next.position.x ? next.position.x : prev[1].x;
                prev[1].z =
                  prev[1].z > next.position.z ? next.position.z : prev[1].z;

                // max
                prev[2].x =
                  prev[2].x < next.position.x ? next.position.x : prev[2].x;
                prev[2].z =
                  prev[2].z < next.position.z ? next.position.z : prev[2].z;
                return prev;
              },
              [
                new Vector3(),
                new Vector3(Infinity, Infinity, Infinity),
                new Vector3(-Infinity, -Infinity, -Infinity),
              ]
            );

            const xDiff = 1 + Math.abs(max.x - min.x);
            const zDiff = 1 + Math.abs(max.z - min.z);
            const diff = xDiff > zDiff ? xDiff : zDiff;
            const fov = 45 * (Math.PI / 180);
            const zoom = (diff / 2 / (fov / 2)) * 1.25;

            useConfigStore.getState().orbitControlsSet({
              position: center,
              zoom,
            });
          }}
        >
          <MdCenterFocusWeak />
        </Button>
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

  React.useEffect(() => {
    useConfigStore.setState({
      orbitControlsSet: ({zoom, position}) => {
        if (controls.current) {
          if (zoom) {
            console.log(zoom);
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
        zoomToCursor
        minDistance={0.5}
        maxDistance={30000000000}
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

const zoomMin = 1;
const zoomMax = 30000000000;
function logslider(position: number, reverse?: boolean) {
  // position will be between 0 and 100
  var minP = 0;
  var maxP = 100;

  // The result should be between 100 an 10000000
  var minV = Math.log(zoomMin);
  var maxV = Math.log(zoomMax);

  // calculate adjustment factor
  var scale = (maxV - minV) / (maxP - minP);
  if (reverse) return (Math.log(position) - minV) / scale + minP;
  return Math.exp(minV + scale * (position - minP));
}

const ZoomSlider = () => {
  const cameraZoom = useConfigStore(store => store.cameraVerticalDistance);
  return (
    <div
      className={`pointer-events-none fixed bottom-0 right-0 w-64 py-6 px-4`}
    >
      <p>Zoom</p>
      <Slider
        min={0}
        max={100}
        step={0.1}
        value={logslider(cameraZoom, true)}
        onChange={e =>
          useConfigStore
            .getState()
            .orbitControlsSet({zoom: logslider(parseFloat(e.target.value))})
        }
      />
    </div>
  );
};
const StarmapCore: React.FC = () => {
  const client = useApolloClient();
  const cameraRef = React.useRef<PerspectiveCamera>();

  const [ref, dragPosition, node] = useDragSelect<HTMLCanvasElement>(
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

      <StarmapCoreMenubar
        canvasHeight={node?.height || 0}
        canvasWidth={node?.width || 0}
      />
      {dragPosition && <DragSelection {...dragPosition}></DragSelection>}
      <ZoomSlider />
    </Suspense>
  );
};

export default StarmapCore;
