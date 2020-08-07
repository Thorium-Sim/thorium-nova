import {OrbitControls} from "drei";
import React, {Suspense} from "react";
import {useFrame, useThree} from "react-three-fiber";
import {MOUSE, Vector3} from "three";
import {configStoreApi} from "./configStore";
import Nebula from "./Nebula";
import Starfield from "./Starfield";
import SystemMarker from "./SystemMarker";

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
});

export default Scene;
