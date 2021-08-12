import {Vector3} from "three";
export const DEG_TO_RAD = Math.PI / 180;

const axis = new Vector3(0, 0, 1);

export function getOrbitPosition({
  radius,
  eccentricity,
  orbitalArc,
  orbitalInclination,
  origin = new Vector3(),
}: OrbitPositionProps) {
  const radiusY = radius - radius * eccentricity;
  const X = radius * Math.cos(DEG_TO_RAD * orbitalArc);
  const Z = radiusY * Math.sin(DEG_TO_RAD * orbitalArc);
  const vec = new Vector3(X, 0, Z);
  const angle = orbitalInclination * DEG_TO_RAD;

  vec.applyAxisAngle(axis, angle).add(origin);
  return vec;
}

interface OrbitPositionProps {
  radius: number;
  eccentricity: number;
  orbitalArc: number;
  orbitalInclination: number;
  origin?: Vector3;
}
