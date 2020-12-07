import {useMemo, useRef, useState} from "react";
import {Canvas, useFrame} from "react-three-fiber";
import {Color, Mesh} from "three";

function Box(props: {position: [number, number, number]}) {
  // This reference will give us direct access to the mesh
  const mesh = useRef<Mesh>(null);

  // Set up state for the hovered and active state
  const [hovered, setHover] = useState(false);
  const [active, setActive] = useState(false);

  // Rotate mesh every frame, this is outside of React without overhead
  useFrame(() => {
    if (mesh.current) {
      mesh.current.rotation.x = mesh.current.rotation.y += 0.01;
    }
  });

  return (
    <mesh
      {...props}
      ref={mesh}
      scale={active ? [1.5, 1.5, 1.5] : [1, 1, 1]}
      onClick={event => setActive(!active)}
      onPointerOver={event => setHover(true)}
      onPointerOut={event => setHover(false)}
    >
      <boxBufferGeometry args={[1, 1, 1]} />
      <meshStandardMaterial color={hovered ? "hotpink" : "orange"} />
    </mesh>
  );
}

const Scene = () => {
  const color = useMemo(() => new Color("black"), []);
  useFrame(({scene}) => {
    scene.background = color;
  });
  return null;
};
const Pilot = () => {
  return (
    <div className="card-pilot h-full grid grid-cols-4 gap-4">
      <Canvas className="h-full rounded-full border-2 border-whiteAlpha-500 col-start-2 col-end-4">
        <Scene />
        <ambientLight />
        <pointLight position={[10, 10, 10]} />
        <Box position={[-1.2, 0, 0]} />
        <Box position={[1.2, 0, 0]} />
      </Canvas>
    </div>
  );
};

export default Pilot;
