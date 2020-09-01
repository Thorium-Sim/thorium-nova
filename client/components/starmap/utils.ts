import {Vector3} from "three";

//gravitational constant to measure the force with masses in kg and radii in meters N(m/kg)^2
export const G = 6.6742e-11;
//astronomical unit in km
export const AU = 149597870;
export const DEG_TO_RAD = Math.PI / 180;
export const RAD_TO_DEG = 180 / Math.PI;

export const whiteImage =
  "data:image/jpeg;base64,/9j/4AAQSkZJRgABAQEASABIAAD/2wCEAP////////////////////////////////////////////////////////////////////////////////////8B///////////////////////////////////////////////////////////////////////////////////////AABEIAAEAAQMBIgACEQEDEQH/xABLAAEBAAAAAAAAAAAAAAAAAAAAAxABAAAAAAAAAAAAAAAAAAAAAAEBAAAAAAAAAAAAAAAAAAAAABEBAAAAAAAAAAAAAAAAAAAAAP/aAAwDAQACEQMRAD8AoAD/2Q==";

interface OrbitPositionProps {
  radius: number;
  eccentricity: number;
  orbitalArc: number;
  orbitalInclination: number;
  origin?: Vector3;
}

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
