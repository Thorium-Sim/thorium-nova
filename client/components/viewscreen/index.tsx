import React, {Suspense} from "react";
import {Canvas, useThree} from "react-three-fiber";
import {ApolloProvider, useApolloClient} from "@apollo/client";
import Nebula from "../starmap/Nebula";
import {OrbitControls} from "../starmap/OrbitControls";
import {useUniverseSystemSubscription} from "../../generated/graphql";
import {configStoreApi, useConfigStore} from "../starmap/configStore";
import StarEntity from "../starmap/entities/StarEntity";
import PlanetEntity from "../starmap/entities/PlanetEntity";
import {getOrbitPosition} from "../starmap/utils";
import {useSetupOrbit} from "../starmap/Planetary";
import {FlyControls} from "drei";
import LensFlare from "../starmap/star/lensFlare";

const FAR = 1e27;

const Scene: React.FC = () => {
  const systemId = useConfigStore(store => store.systemId);
  React.useEffect(() => {
    configStoreApi.setState({systemId: "ew1d9kfkfhc49g2", isViewscreen: true});
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

  if (!system) return null;
  return (
    <>
      <FlyControls movementSpeed={150000} rollSpeed={Math.PI / 10} />
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
      <ambientLight intensity={0.2} />
      {system.items.map(e => {
        if (e.isStar) {
          return <StarEntity key={e.id} entity={e} />;
        }
        if (e.isPlanet) {
          return <PlanetEntity key={e.id} entity={e} />;
        }
        return null;
      })}
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
        onContextMenu={e => {
          e.preventDefault();
        }}
        gl={{antialias: true, logarithmicDepthBuffer: true, alpha: false}}
        camera={{fov: 45, far: FAR}}
        concurrent
      >
        <ApolloProvider client={client}>
          <Scene />
        </ApolloProvider>
      </Canvas>
    </Suspense>
  );
};

export default Viewscreen;
