/* eslint-disable */
import React, {
  forwardRef,
  ForwardedRef,
  MutableRefObject,
  useEffect,
  useRef,
} from "react";
import {
  MOUSE,
  Vector2,
  Vector3,
  Vector4,
  Quaternion,
  Matrix4,
  Spherical,
  Box3,
  Sphere,
  Raycaster,
  MathUtils,
} from "three";
import {
  ReactThreeFiber,
  extend,
  useFrame,
  useThree,
  NodeProps,
  ExtendedColors,
  Overwrite,
} from "@react-three/fiber";
import CameraControlsDefault from "camera-controls";

declare global {
  namespace JSX {
    interface IntrinsicElements {
      cameraControlsDefault: ReactThreeFiber.Node<
        CameraControlsDefault,
        typeof CameraControlsDefault
      >;
    }
  }
}

const subsetOfTHREE = {
  MOUSE: MOUSE,
  Vector2: Vector2,
  Vector3: Vector3,
  Vector4: Vector4,
  Quaternion: Quaternion,
  Matrix4: Matrix4,
  Spherical: Spherical,
  Box3: Box3,
  Sphere: Sphere,
  Raycaster: Raycaster,
  MathUtils: {
    DEG2RAD: MathUtils.DEG2RAD,
    clamp: MathUtils.clamp,
  },
};

CameraControlsDefault.install({THREE: subsetOfTHREE});
extend({CameraControlsDefault});

export const CameraControls = forwardRef<
  CameraControlsDefault,
  ExtendedColors<
    Overwrite<
      Partial<CameraControlsDefault>,
      NodeProps<CameraControlsDefault, typeof CameraControlsDefault>
    >
  >
>((props, ref) => {
  const cameraControls = useRef<CameraControlsDefault | null>(null);
  const camera = useThree(state => state.camera);
  const renderer = useThree(state => state.gl);
  useFrame((_, delta) => cameraControls.current?.update(delta));
  useEffect(() => () => cameraControls.current?.dispose(), []);
  return (
    <cameraControlsDefault
      ref={mergeRefs<CameraControlsDefault>(cameraControls, ref)}
      args={[camera, renderer.domElement]}
      {...props}
    />
  );
});

export type CameraControls = CameraControlsDefault;

function mergeRefs<T>(...refs: (MutableRefObject<T> | ForwardedRef<T>)[]) {
  return (instance: T): void => {
    for (const ref of refs) {
      if (typeof ref === "function") {
        ref(instance);
      } else if (ref) {
        ref.current = instance;
      }
    }
  };
}
