import {InterstellarMap} from "client/src/components/Starmap/InterstellarMap";
import SystemMarker from "client/src/components/Starmap/SystemMarker";
import StarmapCanvas from "client/src/components/Starmap/StarmapCanvas";
import {useEffect, useRef} from "react";
import {
  StarmapStoreProvider,
  useGetStarmapStore,
} from "client/src/components/Starmap/starmapStore";
import {Suspense} from "react";
import {ErrorBoundary} from "react-error-boundary";
import {netRequest, useNetRequest} from "client/src/context/useNetRequest";
import {useDataStream} from "client/src/context/useDataStream";
import {SolarSystemMap} from "client/src/components/Starmap/SolarSystemMap";
import {Planet} from "client/src/components/Starmap/Planet";
import StarEntity from "client/src/components/Starmap/Star";
import {StarmapShip} from "../../components/Starmap/StarmapShip";
import SearchableInput, {DefaultResultLabel} from "@thorium/ui/SearchableInput";
import Input from "@thorium/ui/Input";
import {StarmapCoreContextMenu} from "./StarmapCoreContextMenu";
import {WaypointEntity} from "client/src/cards/Pilot/Waypoint";
import useDragSelect, {
  DragSelection,
  get3dSelectedObjects,
} from "client/src/hooks/useDragSelect";
import {PerspectiveCamera, Vector3} from "three";

export function StarmapCore() {
  const ref = useRef<HTMLDivElement>(null);

  return (
    <div className="h-[calc(100%-2rem)]" ref={ref}>
      <StarmapStoreProvider>
        <StarmapCoreContextMenu parentRef={ref} />
        <div className="border-b border-b-white/20 pb-0.5 px-2 flex gap-2 items-baseline">
          <SpawnSearch />
          <YDimension />
        </div>
        <CanvasWrapper />
      </StarmapStoreProvider>
    </div>
  );
}

function YDimension() {
  const useStarmapStore = useGetStarmapStore();
  const yDimension = useStarmapStore(store => store.yDimensionIndex);
  return (
    <Input
      className="input-sm"
      label="Y Dimension"
      title="Y Dimension"
      labelHidden
      placeholder="Y Dimension"
      type="text"
      inputMode="numeric"
      pattern="[0-9]*"
      value={yDimension}
      onChange={e =>
        useStarmapStore.setState({yDimensionIndex: Number(e.target.value)})
      }
    />
  );
}

function SpawnSearch() {
  const useStarmapStore = useGetStarmapStore();
  const selectedSpawn = useStarmapStore(store => store.spawnShipTemplate);

  return (
    <SearchableInput<{
      id: string;
      pluginName: string;
      name: string;
      category: string;
      vanity: string;
    }>
      inputClassName="input-sm"
      queryKey="spawn"
      getOptions={async ({queryKey, signal}) => {
        const result = await netRequest(
          "shipSpawnSearch",
          {query: queryKey[1]},
          {signal}
        );
        return result;
      }}
      ResultLabel={({active, result, selected}) => (
        <DefaultResultLabel active={active} selected={selected}>
          <div className="flex gap-4">
            <img src={result.vanity} className="w-8 h-8" />
            <div>
              <p className="m-0 leading-none">{result.name}</p>
              <p className="m-0 leading-none">
                <small>{result.category}</small>
              </p>
            </div>
          </div>
        </DefaultResultLabel>
      )}
      setSelected={item => useStarmapStore.setState({spawnShipTemplate: item})}
      selected={selectedSpawn}
      placeholder="Ship Spawn Search..."
    />
  );
}

const startPoint = new Vector3();
const endPoint = new Vector3();

function CanvasWrapper() {
  const useStarmapStore = useGetStarmapStore();
  const currentSystem = useStarmapStore(store => store.currentSystem);
  useDataStream({systemId: currentSystem});

  const cameraRef = useRef<PerspectiveCamera>();

  const [dragRef, dragPosition, node] = useDragSelect<HTMLCanvasElement>(
    ({x1, x2, y1, y2}) => {
      // const ships = Object.values(useSystemShipsStore.getState());
      // if (cameraRef.current) {
      //   const selectedObjectIds = get3dSelectedObjects(
      //     ships.filter(s => s.position) as {
      //       id: string;
      //       position: {
      //         x: number;
      //         y: number;
      //         z: number;
      //       };
      //     }[],
      //     cameraRef.current,
      //     startPoint.set(x1 * 2 - 1, -(y1 * 2 - 1), 0.5),
      //     endPoint.set(x2 * 2 - 1, -(y2 * 2 - 1), 0.5)
      //   );
      //   useStarmapStore.setState({selectedObjectIds});
      // }
    }
  );

  useEffect(() => {
    useStarmapStore.setState({viewingMode: "core"});
  }, []);
  return (
    <>
      <StarmapCanvas
        onCreated={({gl, camera}) => {
          dragRef(gl.domElement);
          cameraRef.current = camera as PerspectiveCamera;
        }}
      >
        <ambientLight intensity={0.2} />
        <pointLight position={[10, 10, 10]} />
        {currentSystem === null ? (
          <InterstellarWrapper />
        ) : (
          <SolarSystemWrapper />
        )}
      </StarmapCanvas>
      {dragPosition && <DragSelection {...dragPosition} />}
    </>
  );
}
export function InterstellarWrapper() {
  const useStarmapStore = useGetStarmapStore();
  const currentSystem = useStarmapStore(store => store.currentSystem);

  const starmapShips = useNetRequest("starmapShips", {systemId: currentSystem});
  const starmapSystems = useNetRequest("starmapSystems");

  return (
    <InterstellarMap>
      {starmapSystems.map(sys =>
        sys.components.position && sys.components.identity ? (
          <SystemMarker
            key={sys.id}
            systemId={sys.id}
            position={
              [
                sys.components.position.x,
                sys.components.position.y,
                sys.components.position.z,
              ] as [number, number, number]
            }
            name={sys.components.identity.name}
            onClick={() =>
              useStarmapStore.setState({selectedObjectIds: [sys.id]})
            }
            onDoubleClick={() =>
              useStarmapStore.getState().setCurrentSystem(sys.id)
            }
          />
        ) : null
      )}
      {starmapShips.map(ship => (
        <Suspense key={ship.id} fallback={null}>
          <ErrorBoundary
            FallbackComponent={() => <></>}
            onError={err => console.error(err)}
          >
            <StarmapShip {...ship} />
          </ErrorBoundary>
        </Suspense>
      ))}
    </InterstellarMap>
  );
}

export function SolarSystemWrapper() {
  const useStarmapStore = useGetStarmapStore();
  const currentSystem = useStarmapStore(store => store.currentSystem);

  if (currentSystem === null) throw new Error("No current system");
  const system = useNetRequest("starmapSystem", {systemId: currentSystem});
  const starmapEntities = useNetRequest("starmapSystemEntities", {
    systemId: currentSystem,
  });
  const starmapShips = useNetRequest("starmapShips", {
    systemId: currentSystem,
  });
  const waypoints = useNetRequest("waypoints", {
    systemId: "all",
  });

  return (
    <SolarSystemMap
      skyboxKey={system?.components.isSolarSystem?.skyboxKey || "Blank"}
    >
      {starmapEntities.map(entity => {
        if (entity.components.isStar) {
          if (!entity.components.satellite) return null;
          return (
            <Suspense key={entity.id} fallback={null}>
              <ErrorBoundary
                FallbackComponent={() => <></>}
                onError={err => console.error(err)}
              >
                <StarEntity
                  star={{
                    id: entity.id,
                    hue: entity.components.isStar.hue,
                    isWhite: entity.components.isStar.isWhite,
                    radius: entity.components.isStar.radius,
                    satellite: entity.components.satellite,
                  }}
                />
              </ErrorBoundary>
            </Suspense>
          );
        }
        if (entity.components.isPlanet) {
          if (!entity.components.satellite) return null;

          return (
            <Suspense key={entity.id} fallback={null}>
              <ErrorBoundary
                FallbackComponent={() => <></>}
                onError={err => console.error(err)}
              >
                <Planet
                  planet={{
                    id: entity.id,
                    satellite: entity.components.satellite,
                    isPlanet: entity.components.isPlanet,
                    name: entity.components.identity?.name || "",
                  }}
                />
              </ErrorBoundary>
            </Suspense>
          );
        }

        return null;
      })}
      {waypoints.map(waypoint => (
        <WaypointEntity key={waypoint.id} waypoint={waypoint} viewscreen />
      ))}
      {starmapShips.map(ship => (
        <Suspense key={ship.id} fallback={null}>
          <ErrorBoundary
            FallbackComponent={() => <></>}
            onError={err => console.error(err)}
          >
            <StarmapShip {...ship} />
          </ErrorBoundary>
        </Suspense>
      ))}
    </SolarSystemMap>
  );
}
