import React from "react";
import {CanvasTexture} from "three";
import {useFrame} from "react-three-fiber";

const size = 50;
const lineWidth = 0.07;

const SystemMarker: React.FC<{position: [number, number, number]}> = ({
  position,
}) => {
  const ctx = React.useMemo(() => {
    const canvas = document.createElement("canvas");

    canvas.height = size;
    canvas.width = size;

    var ctx = canvas.getContext("2d") as CanvasRenderingContext2D;
    return ctx;
  }, []);

  const texture = React.useMemo(() => {
    return new CanvasTexture(ctx.canvas);
  }, [ctx]);

  const radius = React.useRef(0);
  const direction = React.useRef(0);

  function drawRadius(endArc = 360) {
    ctx.clearRect(0, 0, size, size);
    ctx.lineWidth = size / (1 / lineWidth);
    ctx.strokeStyle = "rgba(0,255,255,0.2)";
    ctx.beginPath();
    ctx.arc(
      size / 2,
      size / 2,
      size / 2 - size / (1 / lineWidth),
      0,
      Math.PI * 2
    );
    ctx.stroke();
    ctx.strokeStyle = "cyan";
    ctx.beginPath();
    ctx.arc(
      size / 2,
      size / 2,
      size / 2 - size / (1 / lineWidth),
      -Math.PI / 2,
      endArc
    );
    ctx.stroke();
  }
  React.useEffect(() => {
    drawRadius(radius.current - Math.PI / 2);
  }, []);
  useFrame(() => {
    if (direction.current === 0) return;
    radius.current += 0.5 * direction.current;
    if (radius.current >= Math.PI * 2) {
      direction.current = 0;
      radius.current = Math.PI * 2;
    }
    if (radius.current <= 0) {
      direction.current = 0;
      radius.current = 0;
    }
    drawRadius(radius.current - Math.PI / 2);
    texture.needsUpdate = true;
  });

  return (
    <group
      position={position}
      onClick={() => console.log("click")}
      onPointerOver={() => {
        direction.current = 1;
      }}
      onPointerOut={() => {
        direction.current = -1;
      }}
    >
      <sprite scale={[0.07, 0.07, 0.07]}>
        <spriteMaterial
          attach="material"
          map={texture}
          sizeAttenuation={false}
        />
      </sprite>
    </group>
  );
};

export default SystemMarker;
