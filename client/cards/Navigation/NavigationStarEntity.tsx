import OrbitContainer from "client/components/starmap/OrbitContainer";
import Star from "client/components/starmap/star";
import {FC} from "react";
import {Color} from "three";
import {EntityType, itemEvents} from "./utils";
const SUN_RADIUS = 696_340;

export const NavigationStarEntity: FC<{entity: EntityType}> = ({entity}) => {
  if (!entity.isStar || !entity.satellite) return null;
  const {
    distance,
    eccentricity,
    orbitalArc,
    orbitalInclination,
    showOrbit,
  } = entity.satellite;
  const color1 = new Color(
    `hsl(${entity.isStar.hue}, 100%, ${entity.isStar.isWhite ? 100 : 50}%)`
  );
  const color2 = new Color(
    `hsl(${entity.isStar.hue + 20}, 100%, ${entity.isStar.isWhite ? 100 : 50}%)`
  );
  const size = entity.isStar.radius * SUN_RADIUS;
  return (
    <OrbitContainer
      radius={distance}
      eccentricity={eccentricity}
      orbitalArc={orbitalArc}
      orbitalInclination={orbitalInclination}
      showOrbit={showOrbit}
    >
      <group {...itemEvents(entity)} scale={[size, size, size]}>
        {/* {selected && configStoreApi.getState().viewingMode !== "viewscreen" && (
      <Selected />
    )} */}
        <Star
          color1={color1}
          color2={color2}
          size={size}
          noLensFlare
          showSprite
        />
      </group>
    </OrbitContainer>
  );
};
