import {useTexture} from "@react-three/drei";
import {useFrame} from "@react-three/fiber";
import {getSphericalPositionWithBias} from "client/src/utils/getSphericalPositionWithBias";
import {useRef} from "react";
import {Group, Sprite} from "three";
import {useForwardVelocity} from "../Pilot/ImpulseControls";
import FuzzTexture from "./fuzz.png";

export const Fuzz = () => {
  const spriteMap = useTexture(FuzzTexture);
  const spriteRef = useRef<Group>(null);
  const getForwardVelocity = useForwardVelocity();
  useFrame(({camera}) => {
    const children = (spriteRef.current?.children as Sprite[]) || [];
    const [forwardVelocity] = getForwardVelocity();
    const cameraOpacity = Math.max(0, Math.min(1, forwardVelocity));
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
      if (c.material.opacity < 0.05) {
        c.visible = false;
      } else {
        c.visible = true;
      }
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
