import React from "react";
import {Color} from "three";
import {TemplateSystemSubscription} from "../../../generated/graphql";
import OrbitContainer from "../OrbitContainer";
import Star from "../star";

const StarEntity: React.FC<{
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
  if (!entity.isStar) return null;
  const color1 = new Color(
    `hsl(${entity.isStar.hue}, 100%, ${entity.isStar.isWhite ? 100 : 50}%)`
  );
  const color2 = new Color(
    `hsl(${entity.isStar.hue + 20}, 100%, ${entity.isStar.isWhite ? 100 : 50}%)`
  );

  const size = 10 + 5 * entity.isStar.radius;
  return (
    <OrbitContainer
      radius={distance}
      eccentricity={eccentricity}
      orbitalArc={orbitalArc}
      orbitalInclination={orbitalInclination}
      showOrbit={showOrbit}
    >
      <Star color1={color1} color2={color2} scale={[size, size, size]} />
    </OrbitContainer>
  );
};

export default StarEntity;
