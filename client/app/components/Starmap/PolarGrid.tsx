import {
  type 
  PolarGridHelperProps,
  type 
  GridHelperProps,
  useFrame,
} from "@react-three/fiber";
import * as React from "react";
import {AdditiveBlending, type PolarGridHelper, type GridHelper} from "three";
import {useGetStarmapStore} from "./starmapStore";

export function PolarGrid(props: PolarGridHelperProps) {
  const polarRef = React.useRef<PolarGridHelper>(null);
  React.useLayoutEffect(() => {
    if (polarRef.current && !Array.isArray(polarRef.current?.material)) {
      polarRef.current.material.depthWrite = false;
      polarRef.current.material.transparent = true;
      polarRef.current.renderOrder = -1;
      polarRef.current.material.blending = AdditiveBlending;
      polarRef.current.material.opacity = 0.15;
    }
  });
  return <polarGridHelper ref={polarRef} {...props} />;
}
export function Grid(props: GridHelperProps) {
  const gridRef = React.useRef<GridHelper>(null);
  const useStarmapStore = useGetStarmapStore();
  const cameraControls = useStarmapStore(s => s.cameraControls);
  React.useLayoutEffect(() => {
    if (gridRef.current && !Array.isArray(gridRef.current?.material)) {
      gridRef.current.material.depthWrite = false;
      gridRef.current.material.transparent = true;
      gridRef.current.renderOrder = -1;
      gridRef.current.material.blending = AdditiveBlending;
      gridRef.current.material.opacity = 0.15;
    }
  });
  useFrame(() => {
    if (gridRef.current && !Array.isArray(gridRef.current?.material)) {
      const y = cameraControls?.current?.camera.position.y || Number.POSITIVE_INFINITY;
      gridRef.current.material.opacity = Math.min(
        300000000 * (1 / y) * 0.15,
        0.3
      );
    }
  });
  return <gridHelper ref={gridRef} {...props} />;
}
