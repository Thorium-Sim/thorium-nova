import React from "react";
import {useLoader} from "react-three-fiber";
import {
  BufferAttribute,
  DoubleSide,
  RingBufferGeometry,
  TextureLoader,
  Vector3,
} from "three";
import {whiteImage} from "../utils";

interface RingsProps {
  texture: string;
  wireframe?: boolean;
}

const Rings: React.FC<RingsProps> = ({texture = whiteImage, wireframe}) => {
  const rings = useLoader(TextureLoader, texture);
  const geo = React.useMemo(() => {
    const geometry = new RingBufferGeometry(1.5, 3, 64);
    const pos = geometry.attributes.position as BufferAttribute;
    const v3 = new Vector3();
    for (let i = 0; i < pos.count; i++) {
      v3.fromBufferAttribute(pos, i);
      geometry.attributes.uv.setXY(i, v3.length() < 2 ? 0 : 1, 1);
    }
    return geometry;
  }, []);
  return (
    <mesh
      rotation={[Math.PI / 2, 0, 0]}
      scale={[0.7, 0.7, 0.7]}
      geometry={geo}
      receiveShadow
    >
      <meshPhongMaterial
        map={wireframe ? undefined : rings}
        color={0xffffff}
        side={DoubleSide}
        transparent
        opacity={0.8}
        wireframe={wireframe}
        attach="material"
      />
    </mesh>
  );
};

export default Rings;
