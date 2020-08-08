import {OrbitControls} from "drei";
import React, {Suspense} from "react";
import {Navigate, Route, Routes} from "react-router";
import {useFrame, useThree} from "react-three-fiber";
import {MOUSE, Vector3} from "three";
import {configStoreApi} from "./configStore";
import Interstellar from "./Interstellar";
import Nebula from "./Nebula";
import Star from "./star";

const FAR = 1e27;

const Scene = React.forwardRef((props, ref) => {
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

  React.useImperativeHandle(ref, () => ({
    camera: () => {
      return camera;
    },
  }));

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
          RIGHT: MOUSE.PAN,
          LEFT: MOUSE.ROTATE,
          MIDDLE: MOUSE.DOLLY,
        }}
      />
      <ambientLight intensity={0.7} />
      <pointLight position={[10, 10, 10]} />
      <Routes>
        <Route
          path="starmap"
          element={<Navigate to="/config/universes" replace />}
        />
        <Route path="starmap/:universeId" element={<Interstellar />} />
      </Routes>
      <Suspense fallback={null}>
        <Nebula />
      </Suspense>
    </>
  );
});

export default Scene;
