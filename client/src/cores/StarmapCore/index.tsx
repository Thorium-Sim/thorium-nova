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
import {useThree} from "@react-three/fiber";
import {FaArrowLeft} from "react-icons/fa";
import Button from "@thorium/ui/Button";

export function StarmapCore() {
  const ref = useRef<HTMLDivElement>(null);
  return (
    <div className="h-[calc(100%-2rem)]" ref={ref}>
      <StarmapStoreProvider>
        <StarmapCoreContextMenu parentRef={ref} />
        <div className="border-b border-b-white/20 pb-0.5 px-2 flex gap-2 items-baseline">
          <ReturnToInterstellar />
          <SpawnSearch />
          <YDimension />
        </div>
        <CanvasWrapper />
      </StarmapStoreProvider>
    </div>
  );
}

function ReturnToInterstellar() {
  const useStarmapStore = useGetStarmapStore();

  const inSystem = useStarmapStore(store => !!store.currentSystem);

  if (!inSystem) return null;

  return (
    <Button
      className="btn-xs"
      onClick={() => useStarmapStore.getState().setCurrentSystem(null)}
    >
      <FaArrowLeft />
    </Button>
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

function CanvasWrapper() {
  const useStarmapStore = useGetStarmapStore();
  const currentSystem = useStarmapStore(store => store.currentSystem);
  useDataStream({systemId: currentSystem});

  useEffect(() => {
    useStarmapStore.setState({viewingMode: "core"});
  }, []);
  return (
    <StarmapCanvas>
      <ambientLight intensity={0.2} />
      <pointLight position={[10, 10, 10]} />
      {currentSystem === null ? (
        <InterstellarWrapper />
      ) : (
        <SolarSystemWrapper />
      )}
    </StarmapCanvas>
  );
}
export function InterstellarWrapper() {
  const useStarmapStore = useGetStarmapStore();
  const currentSystem = useStarmapStore(store => store.currentSystem);

  const starmapShips = useNetRequest("starmapShips", {systemId: currentSystem});
  const starmapSystems = useNetRequest("starmapSystems");

  const {camera} = useThree();
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
            onClick={() => {
              useStarmapStore.setState({selectedObjectId: sys.id});
              const cameraControls =
                useStarmapStore.getState().cameraControls?.current;
              if (sys.components.position && cameraControls) {
                cameraControls.setLookAt(
                  camera.position.x,
                  camera.position.y,
                  camera.position.z,
                  sys.components.position.x,
                  sys.components.position.y,
                  sys.components.position.z,
                  true
                );
              }
            }}
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
