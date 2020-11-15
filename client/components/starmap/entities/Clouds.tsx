import React from "react";
import {useFrame, useLoader} from "react-three-fiber";
import {FrontSide, Mesh, TextureLoader} from "three";
import {whiteImage} from "../utils";

interface CloudsProps {
  texture: string;
}
const Clouds: React.FC<CloudsProps> = ({texture = whiteImage}) => {
  const clouds = useLoader(TextureLoader, texture);
  const ref = React.useRef<Mesh>(null);

  useFrame(() => {
    ref.current?.rotateY(0.0005);
  });
  return (
    <mesh ref={ref} scale={[1.02, 1.02, 1.02]}>
      <sphereBufferGeometry args={[1, 32, 32]} attach="geometry" />
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

export default Clouds;
