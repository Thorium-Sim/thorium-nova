import {InterstellarMap} from "client/src/components/Starmap/InterstellarMap";
import SystemMarker from "client/src/components/Starmap/SystemMarker";
import StarmapCanvas from "client/src/components/Starmap/StarmapCanvas";
import {useEffect} from "react";
import {
  StarmapStoreProvider,
  useGetStarmapStore,
} from "client/src/components/Starmap/starmapStore";
import {Suspense} from "react";
import {ErrorBoundary} from "react-error-boundary";
import {useNetRequest} from "client/src/context/useNetRequest";
import {useDataStream} from "client/src/context/useDataStream";
import {SolarSystemMap} from "client/src/components/Starmap/SolarSystemMap";
import {Planet} from "client/src/components/Starmap/Planet";
import StarEntity from "client/src/components/Starmap/Star";
import {StarmapShip} from "../../components/Starmap/StarmapShip";

export function StarmapCore() {
  return (
    <StarmapStoreProvider>
      <CanvasWrapper />
    </StarmapStoreProvider>
  );
}

function CanvasWrapper() {
  const useStarmapStore = useGetStarmapStore();
  const {currentSystem} = useStarmapStore();
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
function InterstellarWrapper() {
  const useStarmapStore = useGetStarmapStore();
  const {currentSystem, setCurrentSystem} = useStarmapStore();

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
            onClick={() => useStarmapStore.setState({selectedObjectId: sys.id})}
            onDoubleClick={() => setCurrentSystem(sys.id)}
          />
        ) : null
      )}
      {starmapShips.map(ship =>
        ship.components.position && ship.components.isShip ? (
          <Suspense key={ship.id} fallback={null}>
            <ErrorBoundary
              FallbackComponent={() => <></>}
              onError={err => console.error(err)}
            >
              <StarmapShip {...ship} />
            </ErrorBoundary>
          </Suspense>
        ) : null
      )}
    </InterstellarMap>
  );
}

function SolarSystemWrapper() {
  const useStarmapStore = useGetStarmapStore();
  const {currentSystem} = useStarmapStore();
  if (!currentSystem) throw new Error("No current system");
  const system = useNetRequest("starmapSystem", {systemId: currentSystem});
  const starmapEntities = useNetRequest("starmapSystemEntities", {
    systemId: currentSystem,
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
        if (entity.components.isShip) {
          return (
            <Suspense key={entity.id} fallback={null}>
              <ErrorBoundary
                FallbackComponent={() => <></>}
                onError={err => console.error(err)}
              >
                <StarmapShip {...entity} />
              </ErrorBoundary>
            </Suspense>
          );
        }
        return null;
      })}
    </SolarSystemMap>
  );
}
