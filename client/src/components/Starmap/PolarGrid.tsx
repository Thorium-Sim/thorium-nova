import {PolarGridHelperProps} from "@react-three/fiber";
import * as React from "react";
import {useEffect} from "react";
import {AdditiveBlending, PolarGridHelper} from "three";

export function PolarGrid(props: PolarGridHelperProps) {
  const polarRef = React.useRef<PolarGridHelper>(null);
  useEffect(() => {
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
