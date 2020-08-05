import React from "react";
import {
  Camera,
  CanvasTexture,
  Group,
  Matrix4,
  Mesh,
  MeshBasicMaterial,
  Object3D,
  Plane,
  Quaternion,
  Raycaster,
  Vector2,
  Vector3,
} from "three";
import {useFrame, useThree} from "react-three-fiber";
import {Text} from "drei";
import {useGesture} from "react-use-gesture";

const size = 50;
const lineWidth = 0.07;

// let pos = new Vector3();
// const planeY = new Plane(new Vector3(0, 0, 1), 0);
const raycaster = new Raycaster();

// export function get3DMousePosition(
//   mv: Vector2,
//   camera: Camera,
//   distance: number = 10
// ) {
//   const distVector = new Vector3(0, 0, -distance).applyQuaternion(
//     camera.quaternion
//   );
//   let normal = new Vector3(0, 0, -distance).negate().normalize();
//   // convert to world space...
//   camera.localToWorld(normal);
//   normal.sub(camera.position); // fix the normal based on the camera position
//   planeY.setFromNormalAndCoplanarPoint(
//     normal,
//     camera.position.clone().add(distVector)
//   );

//   raycaster.ray.intersectPlane(planeY, pos);
//   return pos;
// }

function useObjectDrag(
  obj: React.MutableRefObject<Object3D>,
  onMouseUp: any,
  onMouseDown: any
) {
  const {mouse, camera} = useThree();

  const distance = React.useRef<number>(0);
  const plane = React.useRef(new Plane(new Vector3(0, 0, 1), 0));
  const intersection = React.useRef(new Vector3());
  const worldPosition = React.useRef(new Vector3());
  const offset = React.useRef(new Vector3());
  const inverseMatrix = React.useRef(new Matrix4());

  const bind = useGesture(
    {
      onDragStart: () => {
        onMouseDown?.();
        distance.current = camera.position.distanceTo(obj.current.position);
        plane.current.setFromNormalAndCoplanarPoint(
          camera.getWorldDirection(plane.current.normal),
          worldPosition.current.setFromMatrixPosition(obj.current.matrixWorld)
        );
        if (
          raycaster.ray.intersectPlane(plane.current, intersection.current) &&
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
      onDragEnd: () => {
        onMouseUp?.();
      },
      onDrag: () => {
        raycaster.setFromCamera(mouse, camera);
        if (raycaster.ray.intersectPlane(plane.current, intersection.current)) {
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
const SystemMarker: React.FC<{
  name: string;
  position: [number, number, number];
  onMouseDown?: () => void;
  onMouseUp?: () => void;
}> = ({name, position, onMouseDown, onMouseUp}) => {
  const ctx = React.useMemo(() => {
    const canvas = document.createElement("canvas");

    canvas.height = size;
    canvas.width = size;

    var ctx = canvas.getContext("2d") as CanvasRenderingContext2D;
    return ctx;
  }, []);

  const texture = React.useMemo(() => {
    return new CanvasTexture(ctx.canvas);
  }, [ctx]);

  const group = React.useRef<Group>(new Group());

  const radius = React.useRef(0);
  const direction = React.useRef(0);

  function drawRadius(endArc = 360) {
    ctx.clearRect(0, 0, size, size);
    ctx.lineWidth = size / (1 / lineWidth);
    ctx.strokeStyle = "rgba(0,255,255,0.2)";
    ctx.beginPath();
    ctx.arc(
      size / 2,
      size / 2,
      size / 2 - size / (1 / lineWidth),
      0,
      Math.PI * 2
    );
    ctx.stroke();
    ctx.strokeStyle = "cyan";
    ctx.beginPath();
    ctx.arc(
      size / 2,
      size / 2,
      size / 2 - size / (1 / lineWidth),
      -Math.PI / 2,
      endArc
    );
    ctx.stroke();
  }
  const text = React.useRef<{
    quaternion: Quaternion;
    material: MeshBasicMaterial;
  }>();
  React.useEffect(() => {
    if (text.current) {
      text.current.material.opacity = 0.5;
    }
    drawRadius(radius.current - Math.PI / 2);
  }, []);

  useFrame(({camera, mouse}) => {
    if (text.current) {
      text.current.quaternion.copy(camera.quaternion);
      if (direction.current !== 0) {
        text.current.material.opacity = Math.max(
          0.5,
          Math.min(1, text.current.material.opacity + 0.05 * direction.current)
        );
      }
    }
    if (direction.current === 0) return;
    radius.current += 0.5 * direction.current;
    if (radius.current >= Math.PI * 2) {
      direction.current = 0;
      radius.current = Math.PI * 2;
    }
    if (radius.current <= 0) {
      direction.current = 0;
      radius.current = 0;
    }
    drawRadius(radius.current - Math.PI / 2);
    texture.needsUpdate = true;
  });

  const bind = useObjectDrag(group, onMouseUp, onMouseDown);
  return (
    <>
      <group position={position} ref={group} scale={[0.07, 0.07, 0.07]}>
        <sprite
          {...bind()}
          onPointerOver={() => {
            direction.current = 1;
            document.body.style.cursor = "pointer";
          }}
          onPointerOut={() => {
            direction.current = -1;
            document.body.style.cursor = "auto";
          }}
        >
          <spriteMaterial
            attach="material"
            map={texture}
            sizeAttenuation={false}
          />
        </sprite>
        <Text
          position={[-15, 0, 0]}
          ref={text}
          color={"rgb(0,255,255)"}
          fontSize={17}
          letterSpacing={0}
          textAlign="right"
          font={require("url:./Electrolize-Regular.woff")}
          anchorX="right"
          anchorY="middle"
        >
          {name}
        </Text>
      </group>
    </>
  );
};

export default SystemMarker;
