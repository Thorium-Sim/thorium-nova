import React, {Suspense} from "react";
import {Canvas, useFrame, useThree} from "react-three-fiber";
import {ApolloProvider, useApolloClient} from "@apollo/client";
import Nebula from "../starmap/Nebula";
import {
  useShipsSetDesiredDestinationMutation,
  useUniverseSystemSubscription,
} from "../../generated/graphql";
import {configStoreApi, useConfigStore} from "../starmap/configStore";
import StarEntity from "../starmap/entities/StarEntity";
import PlanetEntity from "../starmap/entities/PlanetEntity";
import {useSystemShips, useShipsStore} from "../viewscreen/useSystemShips";
import {Group, MOUSE, PerspectiveCamera, Vector3} from "three";
import {ErrorBoundary} from "react-error-boundary";
import {OrbitControls} from "./OrbitControls";
import ShipEntity from "../starmap/entities/ShipEntity";
import useDragSelect from "../../helpers/hooks/useDragSelect";
import styled from "@emotion/styled";
import {getSelectedObjects} from "./dragSelection";
import {useSelectedShips} from "../viewscreen/useSelectedShips";
import {useRightClick} from "client/helpers/hooks/useRightClick";
import {ZoomSlider} from "./ZoomSlider";
import {StarmapCoreMenubar} from "./Menubar";
import ContextMenu from "../ui/ContextMenu";
import useEventListener from "client/helpers/hooks/useEventListener";
import {useTranslate2DTo3D} from "client/helpers/hooks/use2Dto3D";
const FAR = 1e27;

const StarmapCorePlanetary: React.FC = () => {
  const systemId = useConfigStore(store => store.systemId);
  const planetsGroup = React.useRef<Group>();
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

  useFrame(() => {
    if (planetsGroup.current) {
      // Hide planets if that option is set
      if (useConfigStore.getState().hidePlanets) {
        planetsGroup.current.visible = false;
      } else {
        planetsGroup.current.visible = true;
      }
    }
  });
  return (
    <>
      <group ref={planetsGroup}>
        {system?.items.map(e => {
          if (e.isStar) {
            return <StarEntity key={e.id} entity={e} />;
          }
          if (e.isPlanet) {
            return <PlanetEntity key={e.id} entity={e} />;
          }
          return null;
        })}
      </group>
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

const ContextMenuOption: React.FC<React.DetailedHTMLProps<
  React.ButtonHTMLAttributes<HTMLButtonElement>,
  HTMLButtonElement
>> = ({children, ...props}) => {
  return (
    <button
      className="px-2 py-1  text-left cursor-pointer hover:bg-purple-700 hover:bg-opacity-50 focus:outline-none focus:shadow-outline transition-all"
      {...props}
    >
      {children}
    </button>
  );
};
const CanvasContextMenu = () => {
  const contextMenuRef = React.useRef<HTMLDivElement>(null);
  useEventListener("pointerdown", (e: MouseEvent) => {
    const target = e.target as HTMLElement;
    if (contextMenuRef.current === target.parentElement) return;
    useConfigStore.setState({contextMenuPosition: null});
  });
  const [setDestination] = useShipsSetDesiredDestinationMutation();

  useRightClick(e => {
    const selectedShips = useSelectedShips.getState().selectedIds;
    if (selectedShips.length > 0) {
      const position = useConfigStore
        .getState()
        .translate2dTo3d?.(e.clientX, e.clientY);
      if (!position) return;
      setDestination({
        variables: {shipPositions: selectedShips.map(id => ({id, position}))},
      });
      return;
    }
    useConfigStore.setState({contextMenuPosition: {x: e.pageX, y: e.pageY}});
  });
  React.useEffect(() => {
    // If the camera zooms in or out, hide the context menu.
    const sub = useConfigStore.subscribe(
      store => useConfigStore.setState({contextMenuPosition: null}),
      store => store.cameraVerticalDistance
    );
    return () => sub();
  }, []);
  const contextMenuPosition = useConfigStore(
    store => store.contextMenuPosition
  );
  if (!contextMenuPosition) return null;
  return (
    <ContextMenu {...contextMenuPosition}>
      <div
        ref={contextMenuRef}
        className="text-white bg-opacity-50 bg-black border border-opacity-25 border-white rounded-sm  text-lg divide-y divide-purple-500 divide-opacity-25 flex flex-col"
      >
        <ContextMenuOption onClick={() => console.log("Spawn")}>
          Spawn Here...
        </ContextMenuOption>
        <ContextMenuOption>Measure Distance</ContextMenuOption>
      </div>
    </ContextMenu>
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
