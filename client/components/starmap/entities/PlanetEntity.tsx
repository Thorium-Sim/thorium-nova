import React from "react";
import {Vector3} from "three";
import {TemplateSystemSubscription} from "../../../generated/graphql";
import OrbitContainer from "../OrbitContainer";

const Planet: React.FC<{
  position?: Vector3 | [number, number, number];
  scale: Vector3 | [number, number, number];
}> = ({position, scale}) => {
  return (
    <group position={position}>
      <mesh scale={scale}>
        <sphereBufferGeometry args={[1, 32, 32]} attach="geometry" />
        <meshPhysicalMaterial color={0x0088ff} attach="material" />
      </mesh>
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
  const size = 5 + 5 * entity.isPlanet.radius;
  return (
    <OrbitContainer
      radius={distance}
      eccentricity={eccentricity}
      orbitalArc={orbitalArc}
      orbitalInclination={orbitalInclination}
      showOrbit={showOrbit}
    >
      <Planet scale={[size, size, size]} />
    </OrbitContainer>
  );
};

export default PlanetEntity;
