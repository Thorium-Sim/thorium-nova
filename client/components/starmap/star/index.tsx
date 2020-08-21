import React from "react";
import {useFrame, useLoader} from "react-three-fiber";
import {
  TextureLoader,
  RepeatWrapping,
  Mesh,
  ShaderMaterial,
  Color,
  Vector3,
  AdditiveBlending,
} from "three";
import Selected from "../entities/Selected";
import LensFlare from "./lensFlare";
import {fragment, vertex} from "./shaders";
import getUniforms from "./uniforms";

const Star: React.FC<{
  color1?: number | Color;
  color2?: number | Color;
  scale?: Vector3 | [number, number, number];
  position?: Vector3 | [number, number, number];
}> = ({color1 = 0x224488, color2 = 0xf6fcff, ...props}) => {
  const filePath = require("url:./textures/01_Texture.jpg");
  const texture = React.useMemo(() => {
    const loader = new TextureLoader();
    const texture = loader.load(filePath);
    texture.wrapS = RepeatWrapping;
    texture.wrapT = RepeatWrapping;
    return texture;
  }, []);
  const uniforms = React.useMemo(
    () => getUniforms({map: texture, color1, color2}),
    []
  );
  const shader = React.useRef<Mesh>();

  useFrame(({camera}) => {
    shader.current?.quaternion.copy(camera.quaternion);
    if (shader.current) {
      const mat = shader.current.material as ShaderMaterial;
      mat.uniforms.time.value += 0.03;
    }
  });

  return (
    <group {...props}>
      <pointLight intensity={1} decay={2} color={color1} castShadow />
      <mesh ref={shader}>
        <circleBufferGeometry attach="geometry" args={[1, 8, 8]} />
        <shaderMaterial
          attach="material"
          fragmentShader={fragment}
          vertexShader={vertex}
          uniforms={uniforms}
          blending={AdditiveBlending}
          transparent
          depthTest={false}
        />
      </mesh>
      <mesh>
        <sphereBufferGeometry attach="geometry" args={[0.5, 8, 16]} />
        <meshBasicMaterial attach="material" color={0x000000} />
      </mesh>
    </group>
  );
};

export default Star;
