import React from "react";
import {BufferGeometry, EllipseCurve, MathUtils} from "three";

export const OrbitLine: React.FC<{radiusX: number; radiusY: number}> = ({
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

    const points = curve.getPoints(
      Math.round(Math.max(1000, radiusX / 400000))
    );

    const geometry = new BufferGeometry().setFromPoints(points);
    return geometry;
  }, [radiusX, radiusY]);

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
  children: React.ReactNode;
  semiMajorAxis: number;
  eccentricity: number;
  orbitalArc: number;
  inclination: number;
  showOrbit: boolean;
}

const OrbitContainer: React.FC<OrbitContainerProps> = ({
  semiMajorAxis,
  eccentricity,
  orbitalArc,
  inclination,
  showOrbit,
  children,
}) => {
  const radiusY = semiMajorAxis - semiMajorAxis * eccentricity;
  const X = semiMajorAxis * Math.cos(MathUtils.DEG2RAD * orbitalArc);
  const Z = radiusY * Math.sin(MathUtils.DEG2RAD * orbitalArc);
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
    <group rotation={[0, 0, inclination * MathUtils.DEG2RAD]}>
      {showOrbit && <OrbitLine radiusX={semiMajorAxis} radiusY={radiusY} />}
      {childrenWithProps}
    </group>
  );
};

export default OrbitContainer;
