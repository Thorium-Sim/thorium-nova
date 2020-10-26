import React, {Suspense} from "react";
import {Canvas, useFrame, useLoader, useThree} from "react-three-fiber";
import {ApolloProvider, useApolloClient} from "@apollo/client";
import Nebula from "../starmap/Nebula";
import {
  UniverseSystemShipsSubscription,
  useUniverseSystemSubscription,
} from "../../generated/graphql";
import {configStoreApi, useConfigStore} from "../starmap/configStore";
import StarEntity from "../starmap/entities/StarEntity";
import PlanetEntity from "../starmap/entities/PlanetEntity";
import {getOrbitPosition} from "../starmap/utils";
import {FlyControls, useGLTFLoader} from "drei";
import {useSystemShips, useShipsStore} from "./useSystemShips";
import {whiteImage} from "./whiteImage";
import {
  Color,
  FrontSide,
  Group,
  Mesh,
  MeshStandardMaterial,
  Object3D,
  Scene,
  Vector3,
  BufferGeometry,
  LineBasicMaterial,
  Line,
  Quaternion,
} from "three";
import {ErrorBoundary} from "react-error-boundary";

const FAR = 1e27;

const ViewscreenScene: React.FC = () => {
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
      <Suspense fallback={null}>
        <Nebula />
      </Suspense>
    </>
  );
};

const ShipEntity: React.FC<{
  entityId: string;
}> = ({entityId}) => {
  const entity = useShipsStore.getState()[entityId];
  if (!entity) return null;
  const modelAsset = entity.shipAssets?.model;
  const model = useGLTFLoader(modelAsset || whiteImage, false);

  const scene = React.useMemo(() => {
    const scene: Group = model.scene.clone(true);
    if (scene.traverse) {
      scene.traverse(function (object: Object3D | Mesh) {
        if ("material" in object) {
          const material = object.material as MeshStandardMaterial;
          material.emissiveMap = material.map;
          material.emissiveIntensity = 0.3;
          material.emissive = new Color(0xffffff);
          material.side = FrontSide;

          object.castShadow = true;
          object.receiveShadow = true;
        }
      });
    }

    return scene;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [modelAsset]);

  const mesh = React.useRef<Mesh>();
  useFrame(({camera}) => {
    const ship = useShipsStore.getState()[entity.id];
    const scale = ship.size.value;
    mesh.current?.scale.set(scale, scale, scale);
    mesh.current?.position.set(
      ship.position.x,
      ship.position.y,
      ship.position.z
    );
    mesh.current?.quaternion.set(
      ship.rotation.x,
      ship.rotation.y,
      ship.rotation.z,
      ship.rotation.w
    );
    // camera.position.set(ship.position.x, ship.position.y, ship.position.z);
    // camera.quaternion
    //   .set(ship.rotation.x, ship.rotation.y, ship.rotation.z, ship.rotation.w)
    //   .multiply(new Quaternion(0, 1, 0, 0));
  });
  return (
    <group ref={mesh}>
      <axesHelper args={[3]} />
      <primitive object={scene} rotation={[Math.PI / 2, Math.PI, 0]} />
    </group>
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
