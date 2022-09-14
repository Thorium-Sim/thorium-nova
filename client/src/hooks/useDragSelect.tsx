import React from "react";
import useMeasure from "./useMeasure";
import useEventListener from "./useEventListener";
import {Frustum, PerspectiveCamera, Vector3} from "three";

type Box = {x: number; y: number; width: number; height: number};
export default function useDragSelect<DOMElement extends HTMLElement>(
  setSelectionBounds?: (param: {
    x1: number;
    x2: number;
    y1: number;
    y2: number;
  }) => void
) {
  const [dragPosition, setDragPosition] = React.useState<Box | null>(null);
  const [initialPosition, setInitialPosition] = React.useState<{
    x: number;
    y: number;
  } | null>(null);
  const [ref, dimensions, , node] = useMeasure<DOMElement>();

  // Create a ref that stores handler
  const savedHandler = React.useRef<Function>();

  // Update ref.current value if handler changes.
  // This allows our effect below to always get latest handler ...
  // ... without us needing to pass it in effect deps array ...
  // ... and potentially cause effect to re-run every render.
  React.useEffect(() => {
    savedHandler.current = setSelectionBounds;
  }, [setSelectionBounds]);

  function calculateCoordinates({x, y, width, height}: Box) {
    return {
      x1: x / dimensions.width,
      x2: (x + width) / dimensions.width,
      y1: y / dimensions.height,
      y2: (y + height) / dimensions.height,
    };
  }

  useEventListener("contextmenu", (e: MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
  });
  useEventListener("pointerdown", (e: MouseEvent) => {
    if (e.button !== 2) return;
    e.preventDefault();

    if (e.target === node) {
      setInitialPosition({
        x: e.clientX - dimensions.left,
        y: e.clientY - dimensions.top,
      });
      setDragPosition({
        x: e.clientX - dimensions.left,
        y: e.clientY - dimensions.top,
        width: 0,
        height: 0,
      });
    }
  });
  useEventListener("pointerup", () => {
    setDragPosition(null);
    setInitialPosition(null);
  });
  useEventListener("pointermove", (e: MouseEvent) => {
    if (dragPosition && initialPosition) {
      const position = {
        x:
          e.clientX - dimensions.left < initialPosition.x
            ? e.clientX - dimensions.left
            : initialPosition.x,
        y:
          e.clientY - dimensions.top < initialPosition.y
            ? e.clientY - dimensions.top
            : initialPosition.y,
        width: Math.abs(e.clientX - initialPosition.x - dimensions.left),
        height: Math.abs(e.clientY - initialPosition.y - dimensions.top),
      };
      setDragPosition(position);
      setSelectionBounds?.(calculateCoordinates(position));
    }
  });
  return [ref, dragPosition, node] as const;
}

export const DragSelection = ({
  width,
  height,
  x,
  y,
}: {
  width: number;
  height: number;
  x: number;
  y: number;
}) => {
  return (
    <div
      className="absolute bg-blue-500/10 border-solid border-blue-500 w-8 h-8 left-0 top-0"
      style={{
        width,
        height,
        translate: `translate(${x}px, ${y}px)`,
      }}
    ></div>
  );
};

var frustum = new Frustum();

var tmpPoint = new Vector3();

var vecNear = new Vector3();
var vecTopLeft = new Vector3();
var vecTopRight = new Vector3();
var vecDownRight = new Vector3();
var vecDownLeft = new Vector3();

var vectemp1 = new Vector3();
var vectemp2 = new Vector3();
var vectemp3 = new Vector3();

const tempVec = new Vector3();
export function get3dSelectedObjects(
  objects: {
    id: string;
    position: {
      x: number;
      y: number;
      z: number;
    };
  }[],
  camera: PerspectiveCamera,
  startPoint: Vector3,
  endPoint: Vector3
) {
  // Avoid invalid frustum
  const deep = Number.MAX_VALUE;

  if (startPoint.x === endPoint.x) {
    endPoint.x += Number.EPSILON;
  }

  if (startPoint.y === endPoint.y) {
    endPoint.y += Number.EPSILON;
  }

  camera.updateProjectionMatrix();
  camera.updateMatrixWorld();

  tmpPoint.copy(startPoint);
  tmpPoint.x = Math.min(startPoint.x, endPoint.x);
  tmpPoint.y = Math.max(startPoint.y, endPoint.y);
  endPoint.x = Math.max(startPoint.x, endPoint.x);
  endPoint.y = Math.min(startPoint.y, endPoint.y);

  vecNear.setFromMatrixPosition(camera.matrixWorld);
  vecTopLeft.copy(tmpPoint);
  vecTopRight.set(endPoint.x, tmpPoint.y, 0);
  vecDownRight.copy(endPoint);
  vecDownLeft.set(tmpPoint.x, endPoint.y, 0);

  vecTopLeft.unproject(camera);
  vecTopRight.unproject(camera);
  vecDownRight.unproject(camera);
  vecDownLeft.unproject(camera);

  vectemp1.copy(vecTopLeft).sub(vecNear);
  vectemp2.copy(vecTopRight).sub(vecNear);
  vectemp3.copy(vecDownRight).sub(vecNear);
  vectemp1.normalize();
  vectemp2.normalize();
  vectemp3.normalize();

  vectemp1.multiplyScalar(deep);
  vectemp2.multiplyScalar(deep);
  vectemp3.multiplyScalar(deep);
  vectemp1.add(vecNear);
  vectemp2.add(vecNear);
  vectemp3.add(vecNear);

  var planes = frustum.planes;

  planes[0].setFromCoplanarPoints(vecNear, vecTopLeft, vecTopRight);
  planes[1].setFromCoplanarPoints(vecNear, vecTopRight, vecDownRight);
  planes[2].setFromCoplanarPoints(vecDownRight, vecDownLeft, vecNear);
  planes[3].setFromCoplanarPoints(vecDownLeft, vecTopLeft, vecNear);
  planes[4].setFromCoplanarPoints(vecTopRight, vecDownRight, vecDownLeft);
  planes[5].setFromCoplanarPoints(vectemp3, vectemp2, vectemp1);
  planes[5].normal.multiplyScalar(-1);

  const collection: string[] = [];

  // TODO: Once we get a 'Flatten Y diimension" button in place, update this.
  objects.forEach(object => {
    tempVec.set(object.position.x, 0, object.position.z);
    if (frustum.containsPoint(tempVec)) {
      collection.push(object.id);
    }
  });
  return collection;
}
