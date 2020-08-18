import {OrbitControls} from "drei";
import React, {Suspense} from "react";
import {useFrame, useThree} from "react-three-fiber";
import {Matrix4, MOUSE, Object3D, Quaternion, Vector3} from "three";
import {configStoreApi, useConfigStore} from "./configStore";
import Interstellar from "./Interstellar";
import Nebula from "./Nebula";
import Planetary from "./Planetary";
import Star from "./star";

const FAR = 1e27;

const Scene = React.forwardRef((props, ref) => {
  const orbitControls = React.useRef<OrbitControls>();
  const frameCount = React.useRef(0);
  const universeId = useConfigStore(s => s.universeId);
  const systemId = useConfigStore(s => s.systemId);

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
        maxDistance={15000}
        minDistance={1}
        rotateSpeed={0.5}
        mouseButtons={
          systemId
            ? {
                LEFT: MOUSE.ROTATE,
                RIGHT: MOUSE.PAN,
                MIDDLE: MOUSE.DOLLY,
              }
            : {
                LEFT: MOUSE.PAN,
                RIGHT: MOUSE.ROTATE,
                MIDDLE: MOUSE.DOLLY,
              }
        }
      />
      <ambientLight intensity={0.7} />
      <pointLight position={[10, 10, 10]} />
      {universeId && !systemId && <Interstellar universeId={universeId} />}
      {universeId && systemId && (
        <Planetary universeId={universeId} systemId={systemId} />
      )}
      <Suspense fallback={null}>
        <Nebula />
      </Suspense>
    </>
  );
});

export default Scene;