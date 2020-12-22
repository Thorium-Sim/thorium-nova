import {
  UniverseSubscription,
  useUniverseSystemSetPositionMutation,
} from "../../../generated/graphql";
import React, {useCallback} from "react";
import {useFrame} from "react-three-fiber";
import {CanvasTexture, Group, Vector3} from "three";
import {configStoreApi, useConfigStore} from "../configStore";
import useObjectDrag from "../hooks/useObjectDrag";

const size = 50;
const lineWidth = 0.07;

const SystemCircle: React.FC<{
  system: NonNullable<UniverseSubscription["pluginUniverse"]>[0];
  parent: React.MutableRefObject<Group>;
  hoveringDirection: React.MutableRefObject<number>;
}> = ({system, parent, hoveringDirection}) => {
  const [setPosition] = useUniverseSystemSetPositionMutation();
  const universeId = useConfigStore(s => s.universeId);
  const setSystemId = useConfigStore(s => s.setSystemId);
  const bind = useObjectDrag(parent, {
    onMouseUp: (position: Vector3) => {
      configStoreApi.getState().enableOrbitControls();
      setPosition({
        variables: {
          id: universeId,
          systemId: system.id,
          position,
        },
      });
    },
    onMouseDown: () => {
      configStoreApi.setState({
        selectedObject: system,
        selectedPosition: parent.current.position,
        scaledSelectedPosition: parent.current.position,
      });
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

  const drawRadius = useCallback(
    function drawRadius(endArc = 360) {
      const selectedObject = configStoreApi.getState().selectedObject;
      const isSelected = system.id === selectedObject?.id;
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
    },
    [ctx, system.id]
  );
  const radius = React.useRef(0);
  const selected = React.useRef(false);

  const texture = React.useMemo(() => {
    const texture = new CanvasTexture(ctx.canvas);
    texture.needsUpdate = true;
    return texture;
  }, [ctx]);

  useFrame(() => {
    const selectedObject = configStoreApi.getState().selectedObject;
    const isSelected = system.id === selectedObject?.id;
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
    <mesh
      {...bind()}
      onPointerOver={() => {
        hoveringDirection.current = 1;
        document.body.style.cursor = "pointer";
        useConfigStore.setState({
          hoveredPosition: parent.current.position,
          scaledHoveredPosition: parent.current.position,
        });
      }}
      onPointerOut={() => {
        hoveringDirection.current = -1;
        document.body.style.cursor = "auto";
        useConfigStore.setState({
          hoveredPosition: null,
          scaledHoveredPosition: null,
        });
      }}
      onDoubleClick={() => {
        setSystemId(system.id);
      }}
    >
      <planeBufferGeometry args={[4, 4, 4]} attach="geometry" />
      <meshBasicMaterial attach="material" map={texture} transparent />
    </mesh>
  );
};
export default SystemCircle;
