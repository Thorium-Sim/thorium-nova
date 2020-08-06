import React from "react";
import {useFrame} from "react-three-fiber";
import {CanvasTexture, Group} from "three";
import {configStoreApi} from "../configStore";
import useObjectDrag from "../hooks/useObjectDrag";

const size = 50;
const lineWidth = 0.07;

const SystemCircle: React.FC<{
  parent: React.MutableRefObject<Group>;
  hoveringDirection: React.MutableRefObject<number>;
}> = ({parent, hoveringDirection}) => {
  const bind = useObjectDrag(
    parent,
    () => {
      configStoreApi.getState().enableOrbitControls();
    },
    () => {
      configStoreApi.getState().disableOrbitControls();
    }
  );
  const ctx = React.useMemo(() => {
    const canvas = document.createElement("canvas");

    canvas.height = size;
    canvas.width = size;

    var ctx = canvas.getContext("2d") as CanvasRenderingContext2D;
    return ctx;
  }, []);

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
  const radius = React.useRef(0);

  useFrame(() => {
    if (hoveringDirection.current === 0) return;
    radius.current += 0.5 * hoveringDirection.current;
    if (radius.current >= Math.PI * 2) {
      hoveringDirection.current = 0;
      radius.current = Math.PI * 2;
    }
    if (radius.current <= 0) {
      hoveringDirection.current = 0;
      radius.current = 0;
    }

    drawRadius(radius.current - Math.PI / 2);
    texture.needsUpdate = true;
  });

  React.useEffect(() => {
    drawRadius(radius.current - Math.PI / 2);
  }, []);

  const texture = React.useMemo(() => {
    return new CanvasTexture(ctx.canvas);
  }, [ctx]);

  return (
    <mesh
      {...bind()}
      onPointerOver={() => {
        hoveringDirection.current = 1;
        document.body.style.cursor = "pointer";
      }}
      onPointerOut={() => {
        hoveringDirection.current = -1;
        document.body.style.cursor = "auto";
      }}
    >
      <planeBufferGeometry args={[4, 4, 4]} attach="geometry" />
      <meshBasicMaterial attach="material" map={texture} transparent />
    </mesh>
  );
};
export default SystemCircle;
