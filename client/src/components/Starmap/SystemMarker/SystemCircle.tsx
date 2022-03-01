import {MeshProps, useFrame} from "@react-three/fiber";
import {netSend} from "client/src/context/netSend";
import useObjectDrag from "client/src/hooks/useObjectDrag";
import * as React from "react";
import {useCallback} from "react";
import {CanvasTexture, Group, Vector3} from "three";
import {useStarmapStore} from "../starmapStore";

const size = 50;
const lineWidth = 0.1;
export const DraggableSystemCircle: React.FC<
  {
    hoveringDirection: React.MutableRefObject<number>;
    systemId: string;
    parentObject: React.MutableRefObject<Group>;
  } & MeshProps
> = ({parentObject: parent, hoveringDirection, systemId, ...props}) => {
  const bind = useObjectDrag(parent, {
    onMouseUp: (position: Vector3) => {
      useStarmapStore.getState().setCameraControlsEnabled(true);
      const pluginId = useStarmapStore.getState().pluginId;
      if (!pluginId) return;
      netSend("pluginSolarSystemUpdate", {
        pluginId,
        solarSystemId: systemId,
        position,
      });
    },
    onMouseDown: () => {
      useStarmapStore.setState({
        selectedObjectId: systemId,
        // selectedPosition: parent.current.position,
        // scaledSelectedPosition: parent.current.position,
      });
      useStarmapStore.getState().setCameraControlsEnabled(false);
    },
    onDrag: (position: Vector3) => {
      useStarmapStore.setState({
        hoveredPosition: [position.x, position.y, position.z],
      });
    },
  });
  const setSystemId = useStarmapStore(s => s.setSystemId);

  return (
    <SystemCircle
      systemId={systemId}
      hoveringDirection={hoveringDirection}
      {...(bind() as any)}
      {...props}
      onPointerOver={e => {
        props?.onPointerOver?.(e);
        const position = parent.current.position;
        useStarmapStore.setState({
          hoveredPosition: [position.x, position.y, position.z],
        });
      }}
      onPointerOut={e => {
        props?.onPointerOut?.(e);
        useStarmapStore.setState({
          hoveredPosition: null,
        });
      }}
      onDoubleClick={() => {
        setSystemId(systemId);
      }}
    />
  );
};

const SystemCircle: React.FC<
  {
    systemId: string;
    hoveringDirection: React.MutableRefObject<number>;
  } & MeshProps
> = ({systemId, hoveringDirection, ...props}) => {
  const ctx = React.useMemo(() => {
    const canvas = document.createElement("canvas");

    canvas.height = size;
    canvas.width = size;

    const ctx = canvas.getContext("2d") as CanvasRenderingContext2D;
    return ctx;
  }, []);

  const drawRadius = useCallback(
    function drawRadius(endArc = 360) {
      const selectedObjectId = useStarmapStore.getState().selectedObjectId;
      const isSelected = systemId === selectedObjectId;
      ctx.clearRect(0, 0, size, size);

      ctx.lineWidth = size / (1 / lineWidth);
      ctx.strokeStyle = isSelected ? "white" : "rgba(0,255,255,0.5)";
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
    },
    [ctx, systemId]
  );
  const radius = React.useRef(0);
  const selected = React.useRef(false);

  const texture = React.useMemo(() => {
    const texture = new CanvasTexture(ctx.canvas);
    texture.needsUpdate = true;
    return texture;
  }, [ctx]);

  useFrame(() => {
    const selectedObjectId = useStarmapStore.getState().selectedObjectId;
    const isSelected = systemId === selectedObjectId;
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
    texture.needsUpdate = true;
  }, [drawRadius, texture]);

  return (
    <mesh {...props}>
      <planeBufferGeometry args={[4, 4, 4]} attach="geometry" />
      <meshBasicMaterial attach="material" map={texture} transparent />
    </mesh>
  );
};
export default SystemCircle;
