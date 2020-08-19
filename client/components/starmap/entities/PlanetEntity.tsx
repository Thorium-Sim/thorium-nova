import React, {Suspense} from "react";
import {useLoader} from "react-three-fiber";
import {TextureLoader, Vector3} from "three";
import {TemplateSystemSubscription} from "../../../generated/graphql";
import OrbitContainer from "../OrbitContainer";
import {DEG_TO_RAD} from "../utils";
import Clouds from "./Clouds";
import Rings from "./Rings";

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
}> = ({position, scale, clouds, rings, texture, axialTilt}) => {
  return (
    <group position={position}>
      <Suspense fallback={null}>
        <group scale={scale} rotation={[0, 0, axialTilt * DEG_TO_RAD]}>
          <Sphere texture={texture} />
          {rings && <Rings texture={rings} />}
          {clouds && <Clouds texture={clouds} />}
        </group>
      </Suspense>

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
  const size = 5 + 5 * (radius / 1000000);
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
