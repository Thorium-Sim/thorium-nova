import {FC, Fragment} from "react";
import {getOrbitPosition} from "client/components/starmap/utils";
import OrbitContainer from "client/components/starmap/OrbitContainer";
import {Planet} from "client/components/starmap/entities/PlanetEntity";
import {Vector3} from "three";
import {EntityType, itemEvents} from "./utils";

export const NavigationPlanetEntity: FC<{
  entity: EntityType;
  isSatellite?: boolean;
  origin?: Vector3;
}> = ({entity, isSatellite, origin}) => {
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

  const position = getOrbitPosition({
    radius: distance,
    eccentricity,
    orbitalArc,
    orbitalInclination,
  });

  return (
    <Fragment>
      <OrbitContainer
        // Convert KM to Millions of KM
        radius={distance}
        eccentricity={eccentricity}
        orbitalArc={orbitalArc}
        orbitalInclination={orbitalInclination}
        showOrbit={showOrbit}
      ></OrbitContainer>
      <Planet
        name={entity.identity.name}
        position={position}
        scaledPosition={position}
        scale={[radius, radius, radius]}
        clouds={cloudsMapAsset}
        rings={ringsMapAsset}
        texture={textureMapAsset}
        axialTilt={axialTilt}
        selected={false}
        showSprite
        wireframe={true}
        isSatellite={isSatellite}
        {...itemEvents(entity)}
      >
        {satellites?.map((s, i) => (
          <NavigationPlanetEntity
            key={`orbit-${i}`}
            isSatellite
            origin={position}
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
    </Fragment>
  );
};
