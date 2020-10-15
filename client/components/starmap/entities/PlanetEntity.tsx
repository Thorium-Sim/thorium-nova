import {scale} from "chroma-js";
import React, {Suspense} from "react";
import {useFrame, useLoader, useThree} from "react-three-fiber";
import {
  CircleGeometry,
  Euler,
  Group,
  LineLoop,
  Quaternion,
  TextureLoader,
  Vector3,
} from "three";
import {
  UniverseObjectFragment,
  SatelliteComponentFragment,
  TemplateSystemSubscription,
} from "../../../generated/graphql";
import {configStoreApi, useConfigStore} from "../configStore";
import OrbitContainer from "../OrbitContainer";
import SystemLabel from "../SystemMarker/SystemLabel";
import {DEG_TO_RAD, getOrbitPosition} from "../utils";
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
  position: Vector3;
  scaledPosition: Vector3;
  scale: Vector3 | [number, number, number];
  clouds: string;
  rings: string;
  texture: string;
  axialTilt: number;
  name: string;
  satellites: UniverseObjectFragment[];
  selected: boolean;
  onPointerOver?: (event: unknown) => void;
  onPointerOut?: (event: unknown) => void;
  onClick?: (event: unknown) => void;
}> = ({
  position,
  scaledPosition = position,
  scale,
  clouds,
  rings,
  texture,
  axialTilt,
  name,
  satellites,
  selected,
  onPointerOver,
  onPointerOut,
  onClick,
}) => {
  const group = React.useRef<Group>();
  useFrame(({camera, mouse}) => {
    if (group.current) {
      const zoom = camera.position.distanceTo(position) + 500;
      let zoomedScale = (zoom / 2) * 0.01;
      group.current.scale.set(zoomedScale, zoomedScale, zoomedScale);
      group.current.quaternion.copy(camera.quaternion);
    }
  });
  return (
    <group position={scaledPosition}>
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
      {!configStoreApi.getState().isViewscreen && (
        <group ref={group}>
          <SystemLabel
            systemId=""
            name={name}
            hoveringDirection={{current: 0}}
          />
        </group>
      )}
      {satellites?.map((s, i) => (
        <PlanetEntity
          key={`orbit-${i}`}
          isSatellite
          origin={position}
          scaledOrigin={scaledPosition}
          entity={{
            ...s,
            satellite: s.satellite
              ? {
                  ...s.satellite,
                  satellites: [],
                }
              : null,
          }}
        />
      ))}
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
  satellites: UniverseObjectFragment[];
  isSatellite: boolean;
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
  satellites,
  isSatellite,
  cloudsMapAsset,
  ringsMapAsset,
  textureMapAsset,
  selected,
  onPointerOver,
  onPointerOut,
  onClick,
}) => {
  const size = configStoreApi.getState().isViewscreen
    ? radius
    : (isSatellite ? 1 : 5) + 100 * (radius / 1000000);
  const scaledRadius = configStoreApi.getState().isViewscreen
    ? distance
    : (isSatellite ? 100 : 1) * (distance / 1000000);
  const position = getOrbitPosition({
    radius: distance,
    eccentricity,
    orbitalArc,
    orbitalInclination,
  });
  const scaledPosition = getOrbitPosition({
    radius: scaledRadius,
    eccentricity,
    orbitalArc,
    orbitalInclination,
  });
  return (
    <>
      <OrbitContainer
        // Convert KM to Millions of KM
        radius={scaledRadius}
        eccentricity={eccentricity}
        orbitalArc={orbitalArc}
        orbitalInclination={orbitalInclination}
        showOrbit={configStoreApi.getState().isViewscreen ? false : showOrbit}
      ></OrbitContainer>
      <Planet
        name={name}
        position={position}
        scaledPosition={scaledPosition}
        scale={[size, size, size]}
        clouds={cloudsMapAsset}
        rings={ringsMapAsset}
        texture={textureMapAsset}
        axialTilt={axialTilt}
        satellites={satellites}
        selected={selected}
        onPointerOver={onPointerOver}
        onPointerOut={onPointerOut}
        onClick={onClick}
      />
    </>
  );
};

const PlanetEntity: React.FC<{
  isSatellite?: boolean;
  origin?: Vector3;
  scaledOrigin?: Vector3;
  entity: TemplateSystemSubscription["pluginUniverseSystem"]["items"][0];
}> = ({entity, origin, scaledOrigin = origin, isSatellite = false}) => {
  const selected = useConfigStore(
    store => store.selectedObject?.id === entity.id
  );
  if (!entity.isPlanet || !entity.satellite) return null;
  const {
    distance,
    eccentricity,
    orbitalArc,
    orbitalInclination,
    showOrbit,
    axialTilt,
    satellites,
  } = entity.satellite;
  const {
    radius,
    cloudsMapAsset,
    ringsMapAsset,
    textureMapAsset,
  } = entity.isPlanet;

  const orbitRadius = distance;
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
      satellites={satellites || []}
      isSatellite={isSatellite}
      cloudsMapAsset={cloudsMapAsset}
      ringsMapAsset={ringsMapAsset}
      textureMapAsset={textureMapAsset}
      selected={selected}
      onPointerOver={() => {
        if (configStoreApi.getState().isViewscreen) return;
        const hoveredPosition = getOrbitPosition({
          eccentricity,
          orbitalArc,
          orbitalInclination,
          radius: orbitRadius,
          origin,
        });
        useConfigStore.setState({
          hoveredPosition,
          scaledHoveredPosition: getOrbitPosition({
            eccentricity,
            orbitalArc,
            orbitalInclination,
            radius: (orbitRadius / 1000000) * (isSatellite ? 100 : 1),
            origin: scaledOrigin,
          }),
        });
        document.body.style.cursor = "pointer";
      }}
      onPointerOut={() => {
        if (configStoreApi.getState().isViewscreen) return;
        document.body.style.cursor = "auto";
        useConfigStore.setState({
          hoveredPosition: null,
          scaledHoveredPosition: null,
        });
      }}
      onClick={() => {
        if (configStoreApi.getState().isViewscreen) return;
        configStoreApi.setState({
          selectedObject: entity,
          selectedPosition: getOrbitPosition({
            eccentricity,
            orbitalArc,
            orbitalInclination,
            radius: orbitRadius,
            origin,
          }),
          scaledSelectedPosition: getOrbitPosition({
            eccentricity,
            orbitalArc,
            orbitalInclination,
            radius: (orbitRadius / 1000000) * (isSatellite ? 100 : 1),
            origin: scaledOrigin,
          }),
        });
      }}
    />
  );
};
export default PlanetEntity;
