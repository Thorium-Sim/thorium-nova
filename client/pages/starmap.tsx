import Nebula from "../components/starmap/Nebula";
import {OrbitControls, PerspectiveCamera} from "drei";
import React, {Suspense} from "react";
import {Canvas, useFrame} from "react-three-fiber";
import {Mesh, Object3D, Vector3} from "three";
import Star from "../components/starmap/star";
import SystemMarker from "../components/starmap/SystemMarker";

function Box(props: {position: Vector3 | [number, number, number]}) {
  // This reference will give us direct access to the mesh
  const mesh = React.useRef<Mesh>(new Mesh());

  // Set up state for the hovered and active state
  const [hovered, setHover] = React.useState(false);
  const [active, setActive] = React.useState(false);

  // Rotate mesh every frame, this is outside of React without overhead
  useFrame(() => (mesh.current.rotation.x = mesh.current.rotation.y += 0.01));

  return (
    <mesh
      {...props}
      ref={mesh}
      scale={active ? [1.5, 1.5, 1.5] : [1, 1, 1]}
      onClick={e => setActive(!active)}
      onPointerOver={e => setHover(true)}
      onPointerOut={e => setHover(false)}
      renderOrder={1}
    >
      <boxBufferGeometry attach="geometry" args={[1, 1, 1]} />
      <meshStandardMaterial
        attach="material"
        color={hovered ? "hotpink" : "orange"}
      />
    </mesh>
  );
}

const FAR = 1e27;

const Starmap: React.FC = () => {
  return (
    <Canvas
      onContextMenu={e => {
        e.preventDefault();
      }}
      sRGB={true}
      gl={{antialias: true, logarithmicDepthBuffer: true}}
      camera={{far: FAR}}
      concurrent
    >
      <Suspense fallback={null}>
        <OrbitControls />
        <ambientLight intensity={0.7} />
        <pointLight position={[10, 10, 10]} />
        <Box position={[-1.2, 0, 0]} />
        <Box position={[1.2, 0, 0]} />
        {/* <Star position={[0, 0, -100]} scale={[50, 50, 50]} /> */}
        <SystemMarker position={[5, 5, 5]} />
        <SystemMarker position={[-5, 5, 5]} />
        <SystemMarker position={[5, -5, 5]} />
        <SystemMarker position={[-5, -5, 5]} />
        <SystemMarker position={[5, 5, -5]} />
        <SystemMarker position={[-5, 5, -5]} />
        <SystemMarker position={[5, -5, -5]} />
        <SystemMarker position={[-5, -5, -5]} />
        <Suspense fallback={null}>
          <Nebula skyboxKey="c" />
        </Suspense>
      </Suspense>
    </Canvas>
  );
};

export default Starmap;
