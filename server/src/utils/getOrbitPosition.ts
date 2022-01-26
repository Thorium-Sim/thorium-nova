import {Vector3} from "three";
import {degToRad} from "./unitTypes";

const axis = new Vector3(0, 0, 1);

export function getOrbitPosition({
  semiMajorAxis,
  eccentricity,
  orbitalArc,
  inclination,
  origin = new Vector3(),
}: OrbitPositionProps) {
  const radiusY = semiMajorAxis - semiMajorAxis * eccentricity;
  const X = semiMajorAxis * Math.cos(degToRad(orbitalArc));
  const Z = radiusY * Math.sin(degToRad(orbitalArc));
  const vec = new Vector3(X, 0, Z);
  const angle = degToRad(inclination);

  vec.applyAxisAngle(axis, angle).add(origin);
  return vec;
}

interface OrbitPositionProps {
  semiMajorAxis: number;
  eccentricity: number;
  orbitalArc: number;
  inclination: number;
  origin?: Vector3;
}
