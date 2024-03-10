import {useTexture} from "@react-three/drei";
import {useFrame} from "@react-three/fiber";
import React from "react";
import {FrontSide, type Mesh} from "three";
import {whiteImage} from "../whiteImage";

interface CloudsProps {
  texture: string;
}
export const Clouds: React.FC<CloudsProps> = ({texture = whiteImage}) => {
  const clouds = useTexture(texture);
  const ref = React.useRef<Mesh>(null);

  useFrame(() => {
    ref.current?.rotateY(0.0005);
  });
  return (
    <mesh ref={ref} scale={[1.02, 1.02, 1.02]}>
      <sphereGeometry args={[1, 32, 32]} attach="geometry" />
      <meshLambertMaterial
        map={clouds}
        side={FrontSide}
        transparent
        opacity={0.7}
        attach="material"
      />
    </mesh>
  );
};
