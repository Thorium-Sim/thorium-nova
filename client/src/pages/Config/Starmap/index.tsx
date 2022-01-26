import Menubar from "@thorium/ui/Menubar";
import {useParams} from "react-router-dom";
import {Canvas, useThree} from "@react-three/fiber";
import {forwardRef, useImperativeHandle, useRef, Suspense} from "react";
import {Camera} from "three";
import Nebula from "client/src/components/Starmap/Nebula";
import {OrbitControls} from "@react-three/drei";
const FAR = 1e27;

interface SceneRef {
  camera: () => Camera;
}

export default function StarMap() {
  const {pluginId} = useParams() as {
    pluginId: string;
  };
  const sceneRef = useRef<SceneRef>();
  return (
    <div className="h-full">
      <Menubar backTo={`/config/${pluginId}/list`}></Menubar>
      <div className="h-[calc(100%-2rem)]">
        <Canvas
          onContextMenu={e => {
            e.preventDefault();
          }}
          gl={{antialias: true, logarithmicDepthBuffer: true, alpha: false}}
          camera={{fov: 45, far: FAR}}
          mode="concurrent"
        >
          <StarmapScene ref={sceneRef} />
        </Canvas>
      </div>
    </div>
  );
}

const StarmapScene = forwardRef((props, ref) => {
  const {camera} = useThree();
  useImperativeHandle(ref, () => ({
    camera: () => {
      return camera;
    },
  }));
  return (
    <>
      <ambientLight intensity={0.2} />
      <pointLight position={[10, 10, 10]} />
      <OrbitControls />
      <mesh rotation={[Math.PI / 3, Math.PI / 5, 0]}>
        <meshLambertMaterial attach="material" color="red" />
        <boxGeometry attach="geometry" args={[1, 1, 1]} />
      </mesh>
      <Suspense fallback={null}>
        <Nebula />
      </Suspense>
    </>
  );
});
