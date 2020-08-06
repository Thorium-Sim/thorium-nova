import React from "react";
import {Matrix4, Object3D, Plane, Raycaster, Vector3} from "three";
import {useThree} from "react-three-fiber";
import {useGesture} from "react-use-gesture";

export default function useObjectDrag(
  obj: React.MutableRefObject<Object3D>,
  onMouseUp: any,
  onMouseDown: any
) {
  const {mouse, camera} = useThree();
  const raycaster = React.useRef(new Raycaster());

  const distance = React.useRef<number>(0);
  const plane = React.useRef(new Plane(new Vector3(0, 0, 1), 0));
  const intersection = React.useRef(new Vector3());
  const worldPosition = React.useRef(new Vector3());
  const offset = React.useRef(new Vector3());
  const inverseMatrix = React.useRef(new Matrix4());

  const bind = useGesture(
    {
      onMouseDown: e => {
        e.stopPropagation();
        onMouseDown?.(e);
      },
      onDragStart: e => {
        e.event?.stopPropagation();
        onMouseDown?.(e);
        distance.current = camera.position.distanceTo(obj.current.position);
        plane.current.setFromNormalAndCoplanarPoint(
          camera.getWorldDirection(plane.current.normal),
          worldPosition.current.setFromMatrixPosition(obj.current.matrixWorld)
        );
        if (
          raycaster.current.ray.intersectPlane(
            plane.current,
            intersection.current
          ) &&
          obj.current.parent
        ) {
          inverseMatrix.current.getInverse(obj.current.parent.matrixWorld);
          offset.current
            .copy(intersection.current)
            .sub(
              worldPosition.current.setFromMatrixPosition(
                obj.current.matrixWorld
              )
            );
        }
      },
      onDragEnd: e => {
        onMouseUp?.();
      },
      onDrag: () => {
        raycaster.current.setFromCamera(mouse, camera);
        if (
          raycaster.current.ray.intersectPlane(
            plane.current,
            intersection.current
          )
        ) {
          obj.current?.position.copy(
            intersection.current
              .sub(offset.current)
              .applyMatrix4(inverseMatrix.current)
          );
        }
      },
    },
    {eventOptions: {pointer: true}}
  );

  return bind;
}
