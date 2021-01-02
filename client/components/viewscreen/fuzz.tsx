import {useTextureLoader} from "drei";
import React from "react";
import {useFrame, useThree} from "react-three-fiber";
import {Spherical, Sprite, Texture, Vector3, MathUtils} from "three";

// From https://karthikkaranth.me/blog/generating-random-points-in-a-sphere/
function randomPointInSphere(radius: number = 1) {
  var u = Math.random();
  var v = Math.random();
  var theta = u * 2.0 * Math.PI;
  var phi = Math.acos(2.0 * v - 1.0);
  var r = Math.cbrt(Math.random()) * radius;
  var sinTheta = Math.sin(theta);
  var cosTheta = Math.cos(theta);
  var sinPhi = Math.sin(phi);
  var cosPhi = Math.cos(phi);
  var x = r * sinPhi * cosTheta;
  var y = r * sinPhi * sinTheta;
  var z = r * cosPhi;
  return [x, y, z] as const;
}

// From http://wip.davidlochhead.xyz/update/2017/10/12/random-position-on-the-surface-of-a-sphere.html
const spherical = new Spherical();
const vec3 = new Vector3();
function getSphericalPositionWithBias(radius = 1, bias = 0.5) {
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
const Fuzz: React.FC = () => {
  const spriteMap = useTextureLoader(require("./fuzz.png").default) as Texture;
  const spriteRef = React.useRef<Sprite>();
  const {camera} = useThree();
  const cameraMovementRef = React.useRef(camera.position.clone());
  const movementRef = React.useRef<number[]>([]);
  useFrame(({camera}) => {
    const children = spriteRef.current?.children as Sprite[];
    const movement = camera.position.distanceTo(cameraMovementRef.current);
    if (movement !== 0) {
      movementRef.current.unshift(movement);
      movementRef.current = movementRef.current.slice(0, 30);
    }
    const averageMovement = movementRef.current.reduce(
      (prev, next, i, arr) => prev + next / arr.length,
      0
    );
    cameraMovementRef.current.copy(camera.position);
    const cameraOpacity = Math.max(0, Math.min(1, averageMovement));
    for (let i = 0; i < children.length; i++) {
      const c = children[i];

      c.userData.opacitySine = c.userData.opacitySine
        ? c.userData.opacitySine + 0.03
        : Math.random() * Math.PI * 2;

      const distance = 1000;
      if (
        (c.position.x === 0 && c.position.y === 0 && c.position.z === 0) ||
        camera.position.distanceTo(c.position) > distance
      ) {
        c.position
          .set(...getSphericalPositionWithBias(distance))
          .add(camera.position);
      }
      c.material.opacity =
        cameraOpacity *
        0.6 *
        ((Math.sin(c.userData.opacitySine) + 1) / 2) *
        (Math.min(
          distance * 0.1,
          Math.max(0, distance - c.position.distanceTo(camera.position))
        ) /
          (distance * 0.1));
    }
  });
  const scale = 5;
  return (
    <group ref={spriteRef}>
      {Array.from({length: 500}).map((_, i) => {
        const spriteScale = scale * Math.random() + 2;
        return (
          <sprite
            key={`sprite-${i}`}
            scale={[spriteScale, spriteScale, spriteScale]}
          >
            <spriteMaterial attach="material" map={spriteMap} color="white" />
          </sprite>
        );
      })}
    </group>
  );
};

export default Fuzz;
