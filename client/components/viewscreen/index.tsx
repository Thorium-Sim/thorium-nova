import React, {Suspense} from "react";
import {Canvas} from "react-three-fiber";
import {ApolloProvider, useApolloClient} from "@apollo/client";
import Nebula from "../starmap/Nebula";
import {
  useUniverseSystemSubscription,
  useViewscreenPlayerShipSubscription,
} from "../../generated/graphql";
import {configStoreApi} from "../starmap/configStore";
import StarEntity from "../starmap/entities/StarEntity";
import PlanetEntity from "../starmap/entities/PlanetEntity";
import {FlyControls} from "drei";
import {useSystemShips} from "./useSystemShips";
import {ErrorBoundary} from "react-error-boundary";
import ShipEntity from "../starmap/entities/ShipEntity";
import {PlayerShipIdProvider} from "./PlayerShipContext";
import {WaypointEntity} from "client/cards/Pilot/PilotContacts";
import Fuzz from "./fuzz";

const FAR = 1e27;

const ViewscreenScene: React.FC = () => {
  const {data: playerData} = useViewscreenPlayerShipSubscription();
  const systemId =
    playerData?.playerShip.interstellarPosition?.system?.id || "";
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
    <>
      <FlyControls movementSpeed={50} rollSpeed={Math.PI / 10} dragToLook />
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
              entity={e}
              playerId={playerData?.playerShip.id || ""}
              viewscreen
            />
          );
        }
        return null;
      })}
      <PlayerShipIdProvider shipId={playerData?.playerShip.id || ""}>
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
        gl={{antialias: true, logarithmicDepthBuffer: true, alpha: false}}
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
