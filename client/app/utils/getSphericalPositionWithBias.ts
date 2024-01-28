import {MathUtils, Spherical, Vector3} from "three";

// From http://wip.davidlochhead.xyz/update/2017/10/12/random-position-on-the-surface-of-a-sphere.html
const spherical = new Spherical();
const vec3 = new Vector3();
export function getSphericalPositionWithBias(radius = 1, bias = 0.5) {
  spherical.radius = radius;
  spherical.phi = getRndBias(0, Math.PI, Math.PI / 2, bias); // Phi is between 0 - PI
  spherical.theta = MathUtils.randFloat(0, Math.PI * 2); // Theta is between 0 - 2 PI
  vec3.setFromSpherical(spherical);

  return [vec3.x, vec3.y, vec3.z] as const;
}
function getRndBias(min: number, max: number, bias: number, influence: number) {
  const rnd = Math.random() * (max - min) + min; // random in range
  const mix = Math.random() * influence; // random mixer
  return rnd * (1 - mix) + bias * mix; // mix full range and bias
}
