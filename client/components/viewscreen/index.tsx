import React, {Fragment, Suspense} from "react";
import {Canvas, useFrame} from "react-three-fiber";
import {ApolloProvider, useApolloClient} from "@apollo/client";
import Nebula from "../starmap/Nebula";
import {
  useUniverseSystemSubscription,
  useViewscreenPlayerShipSubscription,
} from "../../generated/graphql";
import {configStoreApi} from "../starmap/configStore";
import StarEntity from "../starmap/entities/StarEntity";
import PlanetEntity from "../starmap/entities/PlanetEntity";
import {useSystemShips, useSystemShipsStore} from "./useSystemShips";
import {ErrorBoundary} from "react-error-boundary";
import ShipEntity from "../starmap/entities/ShipEntity";
import {PlayerShipIdProvider} from "./PlayerShipContext";
import {WaypointEntity, WaypointType} from "client/cards/Pilot/PilotContacts";
import Fuzz from "./fuzz";
import WarpStars from "./WarpStars";
import {
  useInterstellarShips,
  useInterstellarShipsStore,
} from "./useInterstellarShips";
import {Quaternion} from "three";

const FAR = 1e12;

const forwardQuaternion = new Quaternion(0, 1, 0, 0);
function usePositionViewscreenCamera(
  shipId: string,
  store: typeof useSystemShipsStore | typeof useInterstellarShipsStore
) {
  useFrame(({camera}) => {
    const ship = store.getState()[shipId];
    if (ship && ship.position && ship.rotation) {
      camera.position.set(ship.position.x, ship.position.y, ship.position.z);
      camera.quaternion
        .set(ship.rotation.x, ship.rotation.y, ship.rotation.z, ship.rotation.w)
        .multiply(forwardQuaternion);
    }
  });
}
const InterstellarViewscreen = ({playerShipId}: {playerShipId: string}) => {
  usePositionViewscreenCamera(playerShipId, useInterstellarShipsStore);
  React.useEffect(() => {
    configStoreApi.setState({skyboxKey: "blank"});
  }, []);
  const interstellarShips = useInterstellarShips();
  // TODO: Show other ships in interstellar space
  return <Fragment></Fragment>;
};
const PlanetaryViewscreen = ({
  systemId,
  playerShipId,
}: {
  systemId: string;
  playerShipId: string;
}) => {
  usePositionViewscreenCamera(playerShipId, useSystemShipsStore);

  React.useEffect(() => {
    configStoreApi.setState({
      systemId,
      viewingMode: "viewscreen",
    });
  }, [systemId]);

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
  if (!system) return null;
  return (
    <Fragment>
      {system.items.map(e => {
        if (e.isStar) {
          return <StarEntity key={e.id} entity={e} />;
        }
        if (e.isPlanet) {
          return <PlanetEntity key={e.id} entity={e} />;
        }
        if (e.isWaypoint) {
          return (
            <WaypointEntity
              key={e.id}
              entity={e as WaypointType}
              playerId={playerShipId || ""}
              viewscreen
            />
          );
        }
        return null;
      })}
      <PlayerShipIdProvider shipId={playerShipId || ""}>
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
      </PlayerShipIdProvider>
    </Fragment>
  );
};

const ViewscreenScene: React.FC = () => {
  const {data: playerData} = useViewscreenPlayerShipSubscription();
  const systemId =
    playerData?.playerShip.interstellarPosition?.system?.id || "";
  const playerId = playerData?.playerShip.id;

  if (!playerId) return null;
  return (
    <>
      <pointLight
        intensity={0.2}
        decay={2}
        position={[10000000, 10000000, 1000000]}
      />
      <pointLight
        intensity={0.1}
        decay={2}
        position={[-10000000, -10000000, -1000000]}
      />
      <ambientLight intensity={0.5} />
      <Fuzz />
      <WarpStars isInSystem={!!systemId} shipId={playerId} />
      {systemId ? (
        <Suspense fallback={null}>
          <PlanetaryViewscreen systemId={systemId} playerShipId={playerId} />
        </Suspense>
      ) : (
        <Suspense fallback={null}>
          <InterstellarViewscreen playerShipId={playerId} />
        </Suspense>
      )}
      <Suspense fallback={null}>
        <Nebula />
      </Suspense>
    </>
  );
};

const Viewscreen: React.FC = () => {
  const client = useApolloClient();
  return (
    <Suspense fallback={null}>
      <Canvas
        className="pointer-events-none"
        onContextMenu={e => {
          e.preventDefault();
        }}
        gl={{antialias: false, logarithmicDepthBuffer: true, alpha: false}}
        camera={{fov: 45, near: 0.01, far: FAR}}
        concurrent
      >
        <ApolloProvider client={client}>
          <Suspense fallback={null}>
            <ViewscreenScene />
          </Suspense>
        </ApolloProvider>
      </Canvas>
    </Suspense>
  );
};

export default Viewscreen;
