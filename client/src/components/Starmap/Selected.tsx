import {useFrame} from "@react-three/fiber";
import React from "react";
import {CircleGeometry, LineLoop} from "three";

const Selected: React.FC = React.memo(() => {
  const geometry = React.useMemo(() => {
    const geometry = new CircleGeometry(1.3, 32) as CircleGeometry & {
      vertices: number[];
    };
    // geometry.vertices.shift();

    return geometry;
  }, []);

  const ref1 = React.useRef<LineLoop>();
  const ref2 = React.useRef<LineLoop>();
  useFrame(() => {
    if (!ref1.current || !ref2.current) return;
    ref1.current.rotation.x += 0.01;
    ref1.current?.rotateY(0.02);

    ref2.current.rotation.x += 0.005;
    ref2.current?.rotateY(0.03);
  });

  return (
    <>
      <lineLoop ref={ref1} geometry={geometry}>
        <lineBasicMaterial
          color={0xfac79e}
          transparent
          opacity={0.5}
          attach="material"
        />
      </lineLoop>
      <lineLoop
        ref={ref2}
        geometry={geometry}
        rotation={[Math.random(), Math.random(), Math.random()]}
        scale={[1.1, 1.1, 1.1]}
      >
        <lineBasicMaterial
          color={0xfafa9a}
          transparent
          opacity={0.5}
          attach="material"
        />
      </lineLoop>
    </>
  );
});

export default Selected;
