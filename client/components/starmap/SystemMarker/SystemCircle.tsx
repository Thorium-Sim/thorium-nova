import {useUniverseStarSetPositionMutation} from "../../../generated/graphql";
import React from "react";
import {useFrame} from "react-three-fiber";
import {CanvasTexture, Group, Vector3} from "three";
import {configStoreApi} from "../configStore";
import useObjectDrag from "../hooks/useObjectDrag";
import {useParams} from "react-router";

const size = 50;
const lineWidth = 0.07;

const SystemCircle: React.FC<{
  starId: string;
  parent: React.MutableRefObject<Group>;
  hoveringDirection: React.MutableRefObject<number>;
}> = ({starId, parent, hoveringDirection}) => {
  const [setPosition] = useUniverseStarSetPositionMutation();
  const {universeId} = useParams();
  const bind = useObjectDrag(parent, {
    onMouseUp: (position: Vector3) => {
      configStoreApi.getState().enableOrbitControls();
      setPosition({
        variables: {
          id: universeId,
          starId: starId,
          position,
        },
      });
    },
    onMouseDown: () => {
      configStoreApi.setState({selectedObject: starId});
      configStoreApi.getState().disableOrbitControls();
    },
  });
  const ctx = React.useMemo(() => {
    const canvas = document.createElement("canvas");

    canvas.height = size;
    canvas.width = size;

    var ctx = canvas.getContext("2d") as CanvasRenderingContext2D;
    return ctx;
  }, []);

  function drawRadius(endArc = 360) {
    const selectedObject = configStoreApi.getState().selectedObject;
    const isSelected = starId === selectedObject;
    ctx.clearRect(0, 0, size, size);

    ctx.lineWidth = size / (1 / lineWidth);
    ctx.strokeStyle = isSelected ? "white" : "rgba(0,255,255,0.2)";
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
  const selected = React.useRef(false);
  useFrame(() => {
    const selectedObject = configStoreApi.getState().selectedObject;
    const isSelected = starId === selectedObject;
    if (isSelected) {
      selected.current = true;
    }
    if (selected.current && !isSelected) {
      selected.current = false;
      drawRadius(radius.current - Math.PI / 2);
      texture.needsUpdate = true;
    }
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
