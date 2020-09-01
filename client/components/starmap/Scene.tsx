import React, {Suspense} from "react";
import {useFrame, useThree} from "react-three-fiber";
import {AdditiveBlending, Mesh, Vector3} from "three";
import {useConfigStore} from "./configStore";
import Interstellar from "./Interstellar";
import Nebula from "./Nebula";
import Planetary from "./Planetary";
import {Line} from "drei";
import {Line2} from "three/examples/jsm/lines/Line2";
// @ts-ignore
import TextTexture from "@seregpie/three.text-texture";

function mergeRefs<T = any>(
  refs: Array<React.MutableRefObject<T> | React.LegacyRef<T>>
): React.RefCallback<T> {
  return value => {
    refs.forEach(ref => {
      if (typeof ref === "function") {
        ref(value);
      } else if (ref != null) {
        (ref as React.MutableRefObject<T | null>).current = value;
      }
    });
  };
}

function midPoint(vec1: Vector3, vec2: Vector3) {
  return new Vector3(
    (vec1.x + vec2.x) / 2,
    (vec1.y + vec2.y) / 2,
    (vec1.z + vec2.z) / 2
  );
}

const TextLabel = React.forwardRef<Mesh, {text: string; position?: Vector3}>(
  ({text, position = new Vector3()}, ref) => {
    const textTexture = React.useMemo(() => {
      let texture = new TextTexture({
        fillStyle: "rgb(0,255,255)",
        fontFamily: 'Electrolize, "Gill Sans", sans-serif',
        fontSize: 32,
        align: "right",
        text,
      });
      texture.redraw();
      return texture;
    }, [name]);

    const localRef = React.useRef<Mesh>();
    const scale = 0.8;
    const spriteWidth =
      (textTexture.image.width / textTexture.image.height) * scale;

    useFrame(({camera, mouse}) => {
      if (localRef.current) {
        const zoom = camera.position.distanceTo(localRef.current?.position);
        let zoomedScale = (zoom / 2) * 0.015;
        localRef.current.scale.set(
          zoomedScale * spriteWidth,
          zoomedScale * scale,
          zoomedScale
        );
        localRef.current.quaternion.copy(camera.quaternion);
      }
    });

    return (
      <mesh
        ref={mergeRefs([localRef, ref])}
        position={[-spriteWidth * 2.5 - 2 + position.x, position.y, position.z]}
        userData={{spriteWidth}}
        scale={[spriteWidth, scale, 1]}
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
  }
);
const MeasureLine = () => {
  const selectedPosition = useConfigStore(store => store.selectedPosition);
  const hoveredPosition = useConfigStore(store => store.hoveredPosition);
  const scaledSelectedPosition =
    useConfigStore(store => store.scaledSelectedPosition) || selectedPosition;
  const scaledHoveredPosition =
    useConfigStore(store => store.scaledHoveredPosition) || hoveredPosition;

  const systemId = useConfigStore(store => store.systemId);
  const hasMeasureLine = !!(
    selectedPosition &&
    hoveredPosition &&
    !(
      selectedPosition.x === hoveredPosition.x &&
      selectedPosition.y === hoveredPosition.y &&
      selectedPosition.z === hoveredPosition.z
    )
  );
  const ref = React.useRef<Line2>(null);
  const orb = React.useRef<Mesh>(null);
  useFrame(() => {
    if (!hasMeasureLine) return;
    const {
      scaledSelectedPosition: selectedPosition,
      scaledHoveredPosition: hoveredPosition,
    } = useConfigStore.getState();
    if (!hoveredPosition || !selectedPosition) return;
    const position = [
      selectedPosition.x,
      selectedPosition.y,
      selectedPosition.z,
    ];

    if (ref.current) {
      // @ts-expect-error
      ref.current.geometry.setPositions(
        [
          position,
          [hoveredPosition.x, hoveredPosition.y, hoveredPosition.z],
        ].flat()
      );
    }
    if (orb.current) {
      orb.current.position.copy(
        midPoint(new Vector3(...position), hoveredPosition)
      );
    }
  });
  if (!selectedPosition || !hoveredPosition || !hasMeasureLine) return null;

  const distanceValue =
    Math.round(hoveredPosition.distanceTo(selectedPosition) * 100) / 100;
  const distance = `${distanceValue} ${systemId ? "KM" : "LY"}`;
  return (
    <>
      <Line
        ref={ref}
        points={[[0, 0, 0]]}
        color="#0088ff"
        transparent
        depthTest={false}
        opacity={0.3}
        linewidth={3}
      />
      <TextLabel text={distance} ref={orb} />
    </>
  );
};
const Scene = React.forwardRef((props, ref) => {
  const universeId = useConfigStore(s => s.universeId);
  const systemId = useConfigStore(s => s.systemId);
  const measuring = useConfigStore(s => s.measuring);

  const {camera} = useThree();

  React.useImperativeHandle(ref, () => ({
    camera: () => {
      return camera;
    },
  }));

  return (
    <>
      <ambientLight intensity={0.2} />
      <pointLight position={[10, 10, 10]} />
      {universeId && !systemId && <Interstellar universeId={universeId} />}
      {universeId && systemId && (
        <Planetary universeId={universeId} systemId={systemId} />
      )}
      <Suspense fallback={null}>
        <Nebula />
      </Suspense>
      {measuring && <MeasureLine />}
    </>
  );
});

export default Scene;
