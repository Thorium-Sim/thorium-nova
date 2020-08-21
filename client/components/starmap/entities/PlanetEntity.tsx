import {Line} from "drei";
import React, {Suspense} from "react";
import {useFrame, useLoader} from "react-three-fiber";
import {CircleGeometry, Group, LineLoop, TextureLoader, Vector3} from "three";
import {TemplateSystemSubscription} from "../../../generated/graphql";
import OrbitContainer from "../OrbitContainer";
import SystemLabel from "../SystemMarker/SystemLabel";
import {DEG_TO_RAD} from "../utils";
import Clouds from "./Clouds";
import Rings from "./Rings";

const Selected: React.FC = () => {
  const geometry = React.useMemo(() => {
    const geometry = new CircleGeometry(1.3, 32);
    geometry.vertices.shift();

    return geometry;
  }, []);

  const ref1 = React.useRef<LineLoop>();
  const ref2 = React.useRef<LineLoop>();
  useFrame(() => {
    if (!ref1.current || !ref2.current) return;
    ref1.current.rotation.x += 0.01;
    ref1.current?.rotateY(0.02);

    ref2.current.rotation.x += 0.005;
    ref2.current?.rotateY(0.03);
  });

  return (
    <>
      <lineLoop ref={ref1} geometry={geometry}>
        <lineBasicMaterial
          color={0xfac79e}
          transparent
          opacity={0.5}
          attach="material"
        />
      </lineLoop>
      <lineLoop
        ref={ref2}
        geometry={geometry}
        rotation={[Math.random(), Math.random(), Math.random()]}
        scale={[1.1, 1.1, 1.1]}
      >
        <lineBasicMaterial
          color={0xfafa9a}
          transparent
          opacity={0.5}
          attach="material"
        />
      </lineLoop>
    </>
  );
};
const Sphere: React.FC<{texture: string}> = ({texture}) => {
  const map = useLoader(TextureLoader, texture);

  return (
    <mesh castShadow>
      <sphereBufferGeometry args={[1, 32, 32]} attach="geometry" />
      <meshPhysicalMaterial map={map} transparent attach="material" />
    </mesh>
  );
};
const Planet: React.FC<{
  position?: Vector3 | [number, number, number];
  scale: Vector3 | [number, number, number];
  clouds: string;
  rings: string;
  texture: string;
  axialTilt: number;
  name: string;
}> = ({position, scale, clouds, rings, texture, axialTilt, name}) => {
  const group = React.useRef<Group>(new Group());
  useFrame(({camera, mouse}) => {
    const zoom = camera.position.distanceTo(group.current.position);
    let zoomedScale = (zoom / 2) * 0.015;
    group.current.scale.set(zoomedScale, zoomedScale, zoomedScale);
    group.current.quaternion.copy(camera.quaternion);
  });

  return (
    <group position={position}>
      <Suspense fallback={null}>
        <group scale={scale} rotation={[0, 0, axialTilt * DEG_TO_RAD]}>
          <Sphere texture={texture} />
          {rings && <Rings texture={rings} />}
          {clouds && <Clouds texture={clouds} />}
          <Selected />
        </group>
      </Suspense>
      <group ref={group}>
        <SystemLabel systemId="" name={name} hoveringDirection={{current: 0}} />
      </group>
      {/* {satellites?.map((s, i) => (
  <PlanetEntity key={`orbit-${i}`} {...s} />
))} */}
    </group>
  );
};

const PlanetEntity: React.FC<{
  entity: TemplateSystemSubscription["templateUniverseSystem"]["items"][0];
}> = ({entity}) => {
  const {
    distance,
    eccentricity,
    orbitalArc,
    orbitalInclination,
    showOrbit,
    axialTilt,
  } = entity.satellite;
  if (!entity.isPlanet) return null;
  const {
    radius,
    cloudsMapAsset,
    ringsMapAsset,
    textureMapAsset,
  } = entity.isPlanet;
  const size = 20 + 5 * (radius / 1000000);

  return (
    <OrbitContainer
      // Convert KM to Millions of KM
      radius={distance / 1000000}
      eccentricity={eccentricity}
      orbitalArc={orbitalArc}
      orbitalInclination={orbitalInclination}
      showOrbit={showOrbit}
    >
      <Planet
        name={entity.identity.name}
        scale={[size, size, size]}
        clouds={cloudsMapAsset}
        rings={ringsMapAsset}
        texture={textureMapAsset}
        axialTilt={axialTilt}
      />
    </OrbitContainer>
  );
};

export default PlanetEntity;
