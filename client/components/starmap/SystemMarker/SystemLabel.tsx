import React from "react";
// @ts-ignore
import TextTexture from "@seregpie/three.text-texture";
import {AdditiveBlending, Sprite} from "three";
import {useFrame} from "react-three-fiber";
import {configStoreApi} from "../configStore";

const SystemLabel: React.FC<{
  systemId: string;
  name: string;
  hoveringDirection: React.MutableRefObject<number>;
}> = ({systemId, name, hoveringDirection}) => {
  React.useEffect(() => {
    if (text.current) {
      text.current.material.opacity = 0.5;
    }
  }, []);

  const textTexture = React.useMemo(() => {
    let texture = new TextTexture({
      color: "rgb(0,255,255)",
      fontFamily: 'Electrolize, "Gill Sans", sans-serif',
      fontSize: 32,
      alignment: "right",
      text: name,
    });
    texture.redraw();
    return texture;
  }, [name]);

  const text = React.useRef<Sprite>();
  const selected = React.useRef(false);
  useFrame(() => {
    const selectedObject = configStoreApi.getState().selectedObject;
    const isSelected = systemId === selectedObject?.id;
    if (text.current) {
      if (isSelected) {
        selected.current = true;
        text.current.material.opacity = 1;
        return;
      }

      if (hoveringDirection.current !== 0) {
        text.current.material.opacity = Math.max(
          0.5,
          Math.min(
            1,
            text.current.material.opacity + 0.05 * hoveringDirection.current
          )
        );
      } else if (selected.current) {
        text.current.material.opacity = 0.5;
      }
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
      renderOrder={1000}
    >
      <planeBufferGeometry args={[4, 4, 4]} attach="geometry" />
      <meshBasicMaterial
        attach="material"
        map={textTexture}
        transparent
        blending={AdditiveBlending}
        depthTest={false}
        depthWrite={false}
      />
    </mesh>
  );
};
export default SystemLabel;
