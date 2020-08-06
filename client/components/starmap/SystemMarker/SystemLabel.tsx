import React from "react";
// @ts-ignore
import TextTexture from "@seregpie/three.text-texture";
import {Sprite} from "three";
import {useFrame} from "react-three-fiber";

const SystemLabel: React.FC<{
  name: string;
  hoveringDirection: React.MutableRefObject<number>;
}> = ({name, hoveringDirection}) => {
  React.useEffect(() => {
    if (text.current) {
      text.current.material.opacity = 0.5;
    }
  }, []);

  const textTexture = React.useMemo(() => {
    let texture = new TextTexture({
      fillStyle: "rgb(0,255,255)",
      fontFamily: 'Electrolize, "Gill Sans", sans-serif',
      fontSize: 32,
      align: "right",
      text: name,
    });
    texture.redraw();
    return texture;
  }, [name]);

  const text = React.useRef<Sprite>();

  useFrame(() => {
    if (hoveringDirection.current !== 0 && text.current) {
      text.current.material.opacity = Math.max(
        0.5,
        Math.min(
          1,
          text.current.material.opacity + 0.05 * hoveringDirection.current
        )
      );
    }
  });

  const scale = 0.8;
  const spriteWidth =
    (textTexture.image.width / textTexture.image.height) * scale;

  return (
    <mesh
      position={[-spriteWidth * 2.5 - 2, 0, 0]}
      scale={[spriteWidth, scale, 1]}
      ref={text}
    >
      <planeBufferGeometry args={[4, 4, 4]} attach="geometry" />
      <meshBasicMaterial attach="material" map={textTexture} transparent />
    </mesh>
  );
};
export default SystemLabel;
