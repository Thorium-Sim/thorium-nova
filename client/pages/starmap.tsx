import Nebula from "../components/starmap/Nebula";
import {OrbitControls, PerspectiveCamera} from "drei";
import React, {Suspense} from "react";
import {Canvas, useFrame, useThree} from "react-three-fiber";
import {Mesh, MOUSE, Object3D, Vector3} from "three";
import Star from "../components/starmap/star";
import SystemMarker from "../components/starmap/SystemMarker";
import Starfield from "../components/starmap/Starfield";
import {configStoreApi} from "../components/starmap/configStore";

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

const Scene = () => {
  const orbitControls = React.useRef<OrbitControls>();
  const frameCount = React.useRef(0);

  useFrame((state, delta) => {
    // Auto rotate, but at a very slow rate, so as to keep the
    // starfield visible
    frameCount.current = (frameCount.current + delta) % 125.663;
    if (orbitControls.current) {
      orbitControls.current.autoRotateSpeed =
        Math.sin(frameCount.current / 100) / 100;
    }
  });

  const {camera} = useThree();
  React.useEffect(() => {
    // Block the orbit controls from panning too far
    if (orbitControls.current) {
      var minPan = new Vector3(-300, -300, -300);
      var maxPan = new Vector3(300, 300, 300);
      var _v = new Vector3();

      orbitControls.current.addEventListener?.("change", function () {
        if (orbitControls.current?.target) {
          const target = orbitControls.current.target as Vector3;
          _v.copy(target);
          target.clamp(minPan, maxPan);
          _v.sub(target);
          camera.position.sub(_v);
        }
      });
    }
  }, []);

  React.useEffect(() => {
    configStoreApi.setState({
      disableOrbitControls: () => {
        if (orbitControls.current) {
          orbitControls.current.enabled = false;
        }
      },
      enableOrbitControls: () => {
        if (orbitControls.current) {
          orbitControls.current.enabled = true;
        }
      },
    });
  }, []);
  return (
    <>
      <OrbitControls
        ref={orbitControls}
        autoRotate
        maxDistance={500}
        minDistance={1}
        rotateSpeed={0.5}
        mouseButtons={{
          LEFT: MOUSE.PAN,
          RIGHT: MOUSE.ROTATE,
          MIDDLE: MOUSE.DOLLY,
        }}
      />
      <ambientLight intensity={0.7} />
      <pointLight position={[10, 10, 10]} />
      <SystemMarker position={[0, 0, 0]} name="Alpha Centauri" />
      <SystemMarker position={[0, 2, 0]} name="Sol" />
      <SystemMarker position={[0, 1, 0]} name="Rigel" />

      <Starfield />
      <Suspense fallback={null}>
        <Nebula skyboxKey="c" />
      </Suspense>
    </>
  );
};
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
        <Scene />
      </Suspense>
    </Canvas>
  );
};

export default Starmap;
