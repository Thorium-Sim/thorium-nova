import React from "react";
import {useFrame} from "react-three-fiber";
import {
  TextureLoader,
  RepeatWrapping,
  Mesh,
  ShaderMaterial,
  Color,
  Vector3,
  AdditiveBlending,
} from "three";
import LensFlare from "./lensFlare";
import {fragment, vertex} from "./shaders";
import getUniforms from "./uniforms";
import tc from "tinycolor2";
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
      mat.uniforms.color1.value = color1;
      mat.uniforms.color2.value = color2;
    }
  });

  const color = React.useMemo(() => {
    if (typeof color1 === "number") {
      const color = color1.toString(16);
      return `#${color}`;
    }
    const color = color1.toArray();
    return `rgb(${color[0] * 255},${color[1] * 255},${color[2] * 255})`;
  }, [color1]);
  return (
    <group {...props}>
      <pointLight
        intensity={0.8}
        decay={2}
        color={tc(color).brighten(90).toRgbString()}
        castShadow
      />
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
        <sphereBufferGeometry attach="geometry" args={[0.5, 32, 32]} />
        <meshBasicMaterial attach="material" color={0x000000} />
      </mesh>
      <LensFlare />
    </group>
  );
};

export default Star;
