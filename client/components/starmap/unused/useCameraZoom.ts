import {OrbitControls} from "@react-three/drei";
import React from "react";
import {useFrame, useThree} from "react-three-fiber";
import {Matrix4, Quaternion} from "three";
import {configStoreApi} from "../configStore";

function useCameraZoom(
  orbitControls?: React.MutableRefObject<OrbitControls | undefined>,
  duration: number = 2000
) {
  const {} = useThree();
  const step = React.useRef<number | null>(0);
  const originalDistance = React.useRef(0);
  const rotationMatrix = React.useRef(new Matrix4());
  const targetQuaternion = React.useRef(new Quaternion());
  const [controlsOff, setControlsOff] = React.useState(false);
  useFrame(({camera}, delta) => {
    const target = configStoreApi.getState().zoomTarget;
    if (!target) {
      step.current = null;
      return;
    }
    if (step.current === null) {
      configStoreApi.setState({skyboxKey: Math.random().toString()});
      step.current = 0;
      rotationMatrix.current.lookAt(camera.position, target, camera.up);
      targetQuaternion.current.setFromRotationMatrix(rotationMatrix.current);
      setControlsOff(true);

      originalDistance.current = camera.position.distanceTo(target);
    }
    if (step.current >= 1) {
      step.current = null;
      setControlsOff(false);
      configStoreApi.setState({zoomTarget: null});
      return;
    }

    camera.quaternion.slerp(targetQuaternion.current, step.current);
    camera.position
      .sub(target)
      .setLength(originalDistance.current * Math.abs(1 - step.current))
      .add(target);

    step.current += delta / (duration / 1000);
  });
  return controlsOff;
}
