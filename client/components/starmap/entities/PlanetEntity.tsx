import {useTextureLoader} from "drei";
import React, {Suspense} from "react";
import {useFrame, useLoader} from "react-three-fiber";
import {Group, Texture, TextureLoader, Vector3} from "three";
import {
  UniverseObjectFragment,
  TemplateSystemSubscription,
} from "../../../generated/graphql";
import {configStoreApi, useConfigStore} from "../configStore";
import {PLANETARY_SCALE} from "../constants";
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

const PlanetSprite = ({color = "white"}) => {
  const spriteMap = useTextureLoader("/assets/icons/Dot.svg") as Texture;
  return (
    <sprite>
      <spriteMaterial
        attach="material"
        map={spriteMap}
        color={color}
        sizeAttenuation={false}
      ></spriteMaterial>
    </sprite>
  );
};
const distanceVector = new Vector3();
const SPRITE_SCALE_FACTOR = 50;

export const Planet: React.FC<{
  position: Vector3;
  scaledPosition: Vector3;
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
  showSprite?: boolean;
  isSatellite?: boolean;
}> = ({
  position,
  scaledPosition = position,
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
  children,
  showSprite,
  isSatellite,
}) => {
  const group = React.useRef<Group>();
  const planetSprite = React.useRef<Group>();
  const planetMesh = React.useRef<Group>();
  let size = 0;
  if ("x" in scale) {
    size = scale.x;
  } else {
    size = scale[0];
  }
  useFrame(({camera, mouse}) => {
    if (group.current) {
      const zoom = camera.position.distanceTo(position) + 500;
      let zoomedScale = (zoom / 2) * 0.01;
      group.current.scale.set(zoomedScale, zoomedScale, zoomedScale);
      group.current.quaternion.copy(camera.quaternion);
    }

    const distance = camera.position.distanceTo(
      distanceVector.set(camera.position.x, 0, camera.position.z)
    );

    if (planetSprite.current && planetMesh.current) {
      if (
        size &&
        distance / size > 100 &&
        (useConfigStore.getState().viewingMode === "core" || showSprite)
      ) {
        planetSprite.current.visible = true;
        planetMesh.current.visible = false;
      } else {
        planetSprite.current.visible = false;
        planetMesh.current.visible = true;
      }
    }
  });
  const spriteScale = 1 / SPRITE_SCALE_FACTOR;

  return (
    <group position={scaledPosition}>
      <group
        onPointerOver={onPointerOver}
        onPointerOut={onPointerOut}
        onClick={onClick}
      >
        <Suspense fallback={null}>
          <group
            ref={planetSprite}
            scale={[spriteScale, spriteScale, spriteScale]}
          >
            <PlanetSprite />
          </group>
          <group
            ref={planetMesh}
            scale={scale}
            rotation={[0, 0, axialTilt * DEG_TO_RAD]}
          >
            <Sphere texture={texture} />
            {rings && <Rings texture={rings} />}
            {clouds && <Clouds texture={clouds} />}
            {selected && <Selected />}
          </group>
        </Suspense>
      </group>
      {configStoreApi.getState().viewingMode !== "viewscreen" && !isSatellite && (
        <group ref={group}>
          <SystemLabel
            systemId=""
            name={name}
            hoveringDirection={{current: 0}}
            scale={5 / 128}
          />
        </group>
      )}
      {children}
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
  const size =
    configStoreApi.getState().viewingMode !== "editor"
      ? radius
      : (isSatellite ? 1 : 5) + 100 * (radius * PLANETARY_SCALE);
  const scaledRadius =
    configStoreApi.getState().viewingMode !== "editor"
      ? distance
      : (isSatellite ? 100 : 1) * (distance * PLANETARY_SCALE);
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
        showOrbit={
          configStoreApi.getState().viewingMode === "viewscreen"
            ? false
            : showOrbit
        }
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
        selected={selected}
        isSatellite={isSatellite}
        onPointerOver={onPointerOver}
        onPointerOut={onPointerOut}
        onClick={onClick}
      >
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
      </Planet>
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
        if (configStoreApi.getState().viewingMode === "viewscreen") return;
        if (configStoreApi.getState().viewingMode === "core") return;
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
            radius: orbitRadius * PLANETARY_SCALE * (isSatellite ? 100 : 1),
            origin: scaledOrigin,
          }),
        });
        document.body.style.cursor = "pointer";
      }}
      onPointerOut={() => {
        if (configStoreApi.getState().viewingMode === "viewscreen") return;
        if (configStoreApi.getState().viewingMode === "core") return;
        document.body.style.cursor = "auto";
        useConfigStore.setState({
          hoveredPosition: null,
          scaledHoveredPosition: null,
        });
      }}
      onClick={() => {
        if (configStoreApi.getState().viewingMode === "viewscreen") return;
        if (configStoreApi.getState().viewingMode === "core") return;
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
            radius: orbitRadius * PLANETARY_SCALE * (isSatellite ? 100 : 1),
            origin: scaledOrigin,
          }),
        });
      }}
    />
  );
};
export default PlanetEntity;
