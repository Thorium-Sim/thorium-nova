import {useGetStarmapStore} from "client/src/components/Starmap/starmapStore";
import {useNetRequest} from "client/src/context/useNetRequest";
import {useRef} from "react";
import {SolarSystemMap} from "client/src/components/Starmap/SolarSystemMap";
import {Suspense} from "react";
import {Color, Group, Vector3} from "three";
import {solarRadiusToKilometers} from "server/src/utils/unitTypes";
import {StarSprite} from "client/src/components/Starmap/Star/StarMesh";
import OrbitContainer, {
  OrbitLine,
} from "client/src/components/Starmap/OrbitContainer";
import {getOrbitPosition} from "server/src/utils/getOrbitPosition";
import PlanetPlugin from "server/src/classes/Plugins/Universe/Planet";
import {DEG2RAD} from "three/src/math/MathUtils";
import {planetSpriteScale} from "client/src/components/Starmap/Planet";
import {PlanetSprite} from "client/src/components/Starmap/Planet";
import SystemLabel from "client/src/components/Starmap/SystemMarker/SystemLabel";
import {useFrame} from "@react-three/fiber";
import {ErrorBoundary} from "react-error-boundary";
import {StarmapShip} from "client/src/components/Starmap/StarmapShip";

export function SolarSystemWrapper() {
  const useStarmapStore = useGetStarmapStore();
  const currentSystem = useStarmapStore(store => store.currentSystem);

  if (currentSystem === null) throw new Error("No current system");
  const system = useNetRequest("starmapSystem", {systemId: currentSystem});
  const starmapEntities = useNetRequest("starmapSystemEntities", {
    systemId: currentSystem,
  });
  const ship = useNetRequest("navigationShip");

  return (
    <SolarSystemMap
      skyboxKey={system?.components.isSolarSystem?.skyboxKey || "Blank"}
    >
      {starmapEntities.map(entity => {
        if (entity.components.isStar) {
          if (!entity.components.satellite) return null;
          const size = solarRadiusToKilometers(entity.components.isStar.radius);

          const color = new Color(
            `hsl(${entity.components.isStar.hue}, 100%, ${
              entity.components.isStar.isWhite ? 100 : 50
            }%)`
          );
          return (
            <OrbitContainer key={entity.id} {...entity.components.satellite}>
              <group scale={[size, size, size]}>
                <StarSprite size={size} color1={color} />
              </group>
            </OrbitContainer>
          );
        }
        if (entity.components.isPlanet) {
          if (!entity.components.satellite) return null;
          const position = getOrbitPosition(entity.components.satellite);
          const size = entity.components.isPlanet?.radius;
          const satellites: PlanetPlugin[] = [];
          const {semiMajorAxis, eccentricity, inclination} =
            entity.components.satellite;
          const radiusY = semiMajorAxis - semiMajorAxis * eccentricity;

          return (
            <PlanetRenderer
              key={entity.id}
              name={entity.components.identity?.name}
              position={position}
              semiMajorAxis={semiMajorAxis}
              size={size}
              satellites={satellites}
              inclination={inclination}
              radiusY={radiusY}
            />
          );
        }
        return null;
      })}
      {ship.position?.parentId === currentSystem && (
        <Suspense key={ship.id} fallback={null}>
          <ErrorBoundary
            FallbackComponent={() => <></>}
            onError={err => console.error(err)}
          >
            <StarmapShip id={ship.id} logoUrl={ship.icon} />
          </ErrorBoundary>
        </Suspense>
      )}
    </SolarSystemMap>
  );
}

function PlanetRenderer({
  name,
  position,
  semiMajorAxis,
  size,
  satellites,
  inclination,
  radiusY,
}: {
  name?: string;
  position: Vector3;
  semiMajorAxis: number;
  size: number;
  satellites: PlanetPlugin[];
  inclination: number;
  radiusY: number;
}) {
  const labelRef = useRef<Group>(null);

  useFrame(({camera}) => {
    if (labelRef.current) {
      const zoom = camera.position.distanceTo(position) + 500;
      let zoomedScale = (zoom / 2) * 0.01;
      labelRef.current.scale.set(zoomedScale, zoomedScale, zoomedScale);
      labelRef.current.quaternion.copy(camera.quaternion);
    }
  });

  return (
    <group>
      <group rotation={[0, 0, inclination * DEG2RAD]}>
        <OrbitLine radiusX={semiMajorAxis} radiusY={radiusY} />
      </group>
      <group position={position}>
        <Suspense fallback={null}>
          <group
            scale={[planetSpriteScale, planetSpriteScale, planetSpriteScale]}
          >
            <PlanetSprite />
          </group>
        </Suspense>
        {name && (
          <group ref={labelRef}>
            <SystemLabel
              systemId=""
              name={name}
              hoveringDirection={{current: 0}}
              scale={5 / 128}
            />
          </group>
        )}
      </group>
      {/* TODO June 20, 2022 - Figure out all of the stuff around moons */}
      {/* {satellites?.map((s, i) => (
                <Planet
                  key={`orbit-${s.name}`}
                  isSatellite
                  origin={position}
                  planet={s}
                />
              ))} */}
    </group>
  );
}
