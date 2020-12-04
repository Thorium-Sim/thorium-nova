import React, {Suspense} from "react";
import {Canvas, useThree} from "react-three-fiber";
import {ApolloProvider, useApolloClient} from "@apollo/client";
import Nebula from "../starmap/Nebula";
import {
  useUniverseSystemSubscription,
  useViewscreenPlayerShipSubscription,
} from "../../generated/graphql";
import {configStoreApi} from "../starmap/configStore";
import StarEntity from "../starmap/entities/StarEntity";
import PlanetEntity from "../starmap/entities/PlanetEntity";
import {getOrbitPosition} from "../starmap/utils";
import {FlyControls} from "drei";
import {useSystemShips} from "./useSystemShips";
import {ErrorBoundary} from "react-error-boundary";
import ShipEntity from "../starmap/entities/ShipEntity";
import {PlayerShipIdProvider} from "./PlayerShipContext";

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

  const {camera} = useThree();
  // Center on the planet at first
  const planet = system?.items.find(e => e.isPlanet);
  React.useEffect(() => {
    if (planet?.satellite && planet.isPlanet) {
      const planetPosition = getOrbitPosition({
        ...planet.satellite,
        radius: planet.satellite.distance,
      });
      const position = getOrbitPosition({
        ...planet.satellite,
        radius: planet.satellite.distance + planet.isPlanet.radius * 4,
      });
      camera.position.set(
        position.x + 300,
        position.y + 3000,
        position.z + 30000
      );
      camera.lookAt(planetPosition);
    }
  }, [planet, camera]);

  const ids = useSystemShips();
  if (!system) return null;
  return (
    <>
      <FlyControls movementSpeed={50} rollSpeed={Math.PI / 10} dragToLook />
      <mesh>
        <boxBufferGeometry args={[1, 2, 3]} attach="geometry" />
        <meshStandardMaterial color="rebeccapurple" attach="material" />
      </mesh>
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

      {system.items.map(e => {
        if (e.isStar) {
          return <StarEntity key={e.id} entity={e} />;
        }
        if (e.isPlanet) {
          return <PlanetEntity key={e.id} entity={e} />;
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
