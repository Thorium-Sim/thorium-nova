import React from "react";
import {Color} from "three";
import {TemplateSystemSubscription} from "../../../generated/graphql";
import {configStoreApi, useConfigStore} from "../configStore";
import OrbitContainer from "../OrbitContainer";
import Star from "../star";
import {getOrbitPosition} from "../utils";
import Selected from "./Selected";

const StarEntity: React.FC<{
  entity: TemplateSystemSubscription["pluginUniverseSystem"]["items"][0];
}> = ({entity}) => {
  const selected = useConfigStore(
    store => store.selectedObject?.id === entity.id
  );
  if (!entity.isStar || !entity.satellite) return null;
  const {
    distance,
    eccentricity,
    orbitalArc,
    orbitalInclination,
    showOrbit,
    axialTilt,
  } = entity.satellite;
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
      <group
        onPointerOver={() => {
          document.body.style.cursor = "pointer";
          const position = getOrbitPosition({
            eccentricity,
            orbitalArc,
            orbitalInclination,
            radius: distance,
          });
          useConfigStore.setState({
            hoveredPosition: position,
            scaledHoveredPosition: position,
          });
        }}
        onPointerOut={() => {
          document.body.style.cursor = "auto";
          useConfigStore.setState({
            hoveredPosition: null,
            scaledHoveredPosition: null,
          });
        }}
        onClick={() => {
          const position = getOrbitPosition({
            eccentricity,
            orbitalArc,
            orbitalInclination,
            radius: distance,
          });
          configStoreApi.setState({
            selectedObject: entity,
            selectedPosition: position,
            scaledSelectedPosition: position,
          });
        }}
        scale={[size, size, size]}
      >
        {selected && <Selected />}
        <Star color1={color1} color2={color2} />
      </group>
    </OrbitContainer>
  );
};

export default StarEntity;
