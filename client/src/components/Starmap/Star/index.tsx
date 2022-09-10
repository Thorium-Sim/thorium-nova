import React from "react";
import {solarRadiusToKilometers} from "server/src/utils/unitTypes";
import {Color} from "three";
import OrbitContainer from "../OrbitContainer";
import Star from "./StarMesh";
import Selected from "../Selected";
import {useGetStarmapStore} from "../starmapStore";
import {getOrbitPosition} from "server/src/utils/getOrbitPosition";
import {useThree} from "@react-three/fiber";

const StarEntity: React.FC<{
  star: {
    satellite: {
      semiMajorAxis: number;
      eccentricity: number;
      orbitalArc: number;
      inclination: number;
      showOrbit: boolean;
    };
    hue: number;
    isWhite: boolean;
    radius: number;
    id: string | number;
  };
}> = ({star}) => {
  const useStarmapStore = useGetStarmapStore();
  const viewingMode = useStarmapStore(state => state.viewingMode);
  // const selectedId = useConfigStore(store => store.selectedObject?.id);
  const selected = false; //selectedId === entity.id;
  if (!star.satellite) return null;
  const {semiMajorAxis, eccentricity, orbitalArc, inclination, showOrbit} =
    star.satellite;
  const color1 = new Color(
    `hsl(${star.hue}, 100%, ${star.isWhite ? 100 : 50}%)`
  );
  const color2 = new Color(
    `hsl(${star.hue + 20}, 100%, ${star.isWhite ? 100 : 50}%)`
  );

  const size =
    viewingMode === "editor"
      ? 10 + 5 * star.radius
      : solarRadiusToKilometers(star.radius);
  return (
    <OrbitContainer
      semiMajorAxis={semiMajorAxis}
      eccentricity={eccentricity}
      orbitalArc={orbitalArc}
      inclination={inclination}
      showOrbit={showOrbit}
    >
      <group
        onPointerOver={() => {
          if (viewingMode === "viewscreen") return;
          document.body.style.cursor = "pointer";
          const position = getOrbitPosition({
            eccentricity,
            orbitalArc,
            inclination: inclination,
            semiMajorAxis: semiMajorAxis,
          });
          // useConfigStore.setState({
          //   hoveredPosition: position,
          //   scaledHoveredPosition: position,
          // });
        }}
        onPointerOut={() => {
          if (viewingMode === "viewscreen") return;
          document.body.style.cursor = "auto";
          // useConfigStore.setState({
          //   hoveredPosition: null,
          //   scaledHoveredPosition: null,
          // });
        }}
        onClick={() => {
          if (viewingMode === "viewscreen") return;

          const position = getOrbitPosition({
            eccentricity,
            orbitalArc,
            inclination: inclination,
            semiMajorAxis: semiMajorAxis,
          });

          useStarmapStore.getState().setCameraFocus(position);

          useStarmapStore.setState({
            selectedObjectId: star.id,
            // selectedPosition: position,
            // scaledSelectedPosition: position,
          });
        }}
        scale={[size, size, size]}
      >
        {selected && viewingMode !== "viewscreen" && <Selected />}
        <Star color1={color1} color2={color2} size={size} />
      </group>
    </OrbitContainer>
  );
};

export default StarEntity;
