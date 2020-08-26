import React, {Suspense} from "react";
import {useFrame, useLoader} from "react-three-fiber";
import {CircleGeometry, Group, LineLoop, TextureLoader, Vector3} from "three";
import {TemplateSystemSubscription} from "../../../generated/graphql";
import {configStoreApi, useConfigStore} from "../configStore";
import OrbitContainer from "../OrbitContainer";
import SystemLabel from "../SystemMarker/SystemLabel";
import {DEG_TO_RAD} from "../utils";
import Clouds from "./Clouds";
import Rings from "./Rings";
import Selected from "./Selected";

const Sphere: React.FC<{texture: string}> = React.memo(
  ({texture}) => {
    const map = useLoader(TextureLoader, `${texture}`);
    return (
      <mesh castShadow>
        <sphereBufferGeometry args={[1, 32, 32]} attach="geometry" />
        <meshPhysicalMaterial map={map} transparent attach="material" />
      </mesh>
    );
  },
  (prevProps, nextProps) => {
    if (prevProps.texture === nextProps.texture) return true;
    return false;
  }
);
const Planet: React.FC<{
  position?: Vector3 | [number, number, number];
  scale: Vector3 | [number, number, number];
  clouds: string;
  rings: string;
  texture: string;
  axialTilt: number;
  name: string;
  selected: boolean;
  onPointerOver?: (event: unknown) => void;
  onPointerOut?: (event: unknown) => void;
  onClick?: (event: unknown) => void;
}> = ({
  position,
  scale,
  clouds,
  rings,
  texture,
  axialTilt,
  name,

  selected,
  onPointerOver,
  onPointerOut,
  onClick,
}) => {
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
        <group
          scale={scale}
          rotation={[0, 0, axialTilt * DEG_TO_RAD]}
          onPointerOver={onPointerOver}
          onPointerOut={onPointerOut}
          onClick={onClick}
        >
          <Sphere texture={texture} />
          {rings && <Rings texture={rings} />}
          {clouds && <Clouds texture={clouds} />}
          {selected && <Selected />}
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

const PlanetContainer: React.FC<{
  name: string;

  radius: number;
  distance: number;
  eccentricity: number;
  orbitalArc: number;
  orbitalInclination: number;
  axialTilt: number;
  showOrbit: boolean;
  cloudsMapAsset: string;
  ringsMapAsset: string;
  textureMapAsset: string;
  selected: boolean;
  onPointerOver?: (event: unknown) => void;
  onPointerOut?: (event: unknown) => void;
  onClick?: (event: unknown) => void;
}> = ({
  name,
  radius,
  distance,
  eccentricity,
  orbitalArc,
  orbitalInclination,
  axialTilt,
  showOrbit,
  cloudsMapAsset,
  ringsMapAsset,
  textureMapAsset,
  selected,
  onPointerOver,
  onPointerOut,
  onClick,
}) => {
  const size = 5 + 100 * (radius / 1000000);
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
        name={name}
        scale={[size, size, size]}
        clouds={cloudsMapAsset}
        rings={ringsMapAsset}
        texture={textureMapAsset}
        axialTilt={axialTilt}
        selected={selected}
        onPointerOver={onPointerOver}
        onPointerOut={onPointerOut}
        onClick={onClick}
      />
    </OrbitContainer>
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

  const selected = useConfigStore(
    store => store.selectedObject?.id === entity.id
  );

  return (
    <PlanetContainer
      name={entity.identity.name}
      distance={distance}
      eccentricity={eccentricity}
      orbitalArc={orbitalArc}
      orbitalInclination={orbitalInclination}
      showOrbit={showOrbit}
      axialTilt={axialTilt}
      radius={radius}
      cloudsMapAsset={cloudsMapAsset}
      ringsMapAsset={ringsMapAsset}
      textureMapAsset={textureMapAsset}
      selected={selected}
      onPointerOver={() => {
        document.body.style.cursor = "pointer";
      }}
      onPointerOut={() => {
        document.body.style.cursor = "auto";
      }}
      onClick={() => {
        configStoreApi.setState({selectedObject: entity});
      }}
    />
  );
};
export default PlanetEntity;
