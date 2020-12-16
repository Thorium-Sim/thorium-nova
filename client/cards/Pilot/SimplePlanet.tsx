import {DEG_TO_RAD, getOrbitPosition} from "client/components/starmap/utils";
import {useShipsStore} from "client/components/viewscreen/useSystemShips";
import {useUniverseSystemSubscription} from "client/generated/graphql";
import {memo, useMemo, useRef} from "react";
import {useFrame} from "react-three-fiber";
import {
  BufferAttribute,
  DoubleSide,
  Group,
  RingBufferGeometry,
  Vector3,
} from "three";

const SUN_RADIUS = 696_340;
type EntityType = NonNullable<
  ReturnType<typeof useUniverseSystemSubscription>["data"]
>["universeSystem"]["items"][0];

const BasicRings = () => {
  const geo = useMemo(() => {
    const geometry = new RingBufferGeometry(1.5, 3, 64);
    const pos = geometry.attributes.position as BufferAttribute;
    const v3 = new Vector3();
    for (let i = 0; i < pos.count; i++) {
      v3.fromBufferAttribute(pos, i);
      geometry.attributes.uv.setXY(i, v3.length() < 2 ? 0 : 1, 1);
    }
    return geometry;
  }, []);
  return (
    <mesh
      rotation={[Math.PI / 2, 0, 0]}
      scale={[0.7, 0.7, 0.7]}
      geometry={geo}
      receiveShadow
    >
      <meshBasicMaterial
        color={0xffffff}
        side={DoubleSide}
        wireframe
        transparent
        opacity={0.8}
        attach="material"
      />
    </mesh>
  );
};
export const PlanetaryEntity = memo(
  ({entity, playerId}: {entity: EntityType; playerId: string}) => {
    const ref = useRef<Group>();
    useFrame(() => {
      const playerShip = useShipsStore.getState()[playerId];
      if (
        !playerShip?.position ||
        (!entity.isPlanet && !entity.isStar) ||
        !entity.satellite
      )
        return;
      const position = getOrbitPosition({
        radius: entity.satellite.distance,
        eccentricity: entity.satellite.eccentricity,
        orbitalArc: entity.satellite.orbitalArc,
        orbitalInclination: entity.satellite.orbitalInclination,
      });
      ref.current?.position.set(
        position.x - playerShip.position.x,
        position.y - playerShip.position.y,
        position.z - playerShip.position.z
      );
    });
    if ((!entity.isPlanet && !entity.isStar) || !entity.satellite) return null;
    const size = entity.isPlanet
      ? entity.isPlanet.radius
      : entity.isStar
      ? entity.isStar.radius * SUN_RADIUS
      : 0;

    return (
      <group
        ref={ref}
        scale={[size, size, size]}
        rotation={[0, 0, entity.satellite.axialTilt * DEG_TO_RAD]}
      >
        <mesh>
          <icosahedronBufferGeometry args={[1, 3]} attach="geometry" />
          <meshBasicMaterial wireframe color="white" attach="material" />
        </mesh>
        {entity.isPlanet?.ringsMapAsset && <BasicRings />}
      </group>
    );
  }
);
