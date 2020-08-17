import React from "react";
import {BufferGeometry, EllipseCurve} from "three";
import {DEG_TO_RAD} from "./utils";
const OrbitLine: React.FC<{radiusX: number; radiusY: number}> = ({
  radiusX,
  radiusY,
}) => {
  const geometry = React.useMemo(() => {
    const curve = new EllipseCurve(
      0,
      0, // ax, aY
      radiusX,
      radiusY, // xRadius, yRadius
      0,
      Math.PI * 2,
      false,
      0
    );

    const points = curve.getPoints(100);

    const geometry = new BufferGeometry().setFromPoints(points);
    return geometry;
  }, []);

  return (
    // @ts-ignore
    <line geometry={geometry} rotation={[Math.PI / 2, 0, 0]}>
      <lineBasicMaterial
        attach="material"
        color={0x0088ff}
        linewidth={10}
        linecap={"round"}
        linejoin={"round"}
      />
    </line>
  );
};

interface OrbitContainerProps {
  radius: number;
  eccentricity: number;
  orbitalArc: number;
  orbitalInclination: number;
  showOrbit: boolean;
}
const OrbitContainer: React.FC<OrbitContainerProps> = ({
  radius,
  eccentricity,
  orbitalArc,
  orbitalInclination,
  showOrbit,
  children,
}) => {
  const radiusY = radius - radius * eccentricity;
  const X = radius * Math.cos(DEG_TO_RAD * orbitalArc);
  const Z = radiusY * Math.sin(DEG_TO_RAD * orbitalArc);
  const position = [X, 0, Z];
  const childrenWithProps = React.Children.map(children, child => {
    // checking isValidElement is the safe way and avoids a typescript error too
    const props = {position};
    if (React.isValidElement(child)) {
      return React.cloneElement(child, props);
    }
    return child;
  });
  return (
    <group rotation={[0, 0, orbitalInclination * DEG_TO_RAD]}>
      {showOrbit && <OrbitLine radiusX={radius} radiusY={radiusY} />}
      {childrenWithProps}
    </group>
  );
};

export default OrbitContainer;
