import {FC, useRef} from "react";
import {Object3DNode, useFrame} from "react-three-fiber";
import {Face3, Mesh, OrthographicCamera, Vector3} from "three";

const arrowVertices = [
  new Vector3(0, 0, -0.75),
  new Vector3(0.5, 0, 0.65),
  new Vector3(0, 0.25, 0.2),
  new Vector3(-0.5, 0, 0.65),
  new Vector3(0, -0.25, 0.2),
];
const arrowFaces = [
  new Face3(0, 2, 1),
  new Face3(0, 3, 2),
  new Face3(0, 1, 4),
  new Face3(0, 4, 3),
  new Face3(2, 4, 1),
  new Face3(2, 3, 4),
];
export const Arrow: FC<Object3DNode<any, any>> = props => {
  const ref = useRef<Mesh>(null);
  useFrame(props => {
    const camera = props.camera as OrthographicCamera;
    const dx = (camera.right - camera.left) / (2 * camera.zoom);
    ref.current?.scale.setScalar(dx * 0.1);
  });
  return (
    <mesh
      ref={ref}
      rotation={[Math.PI / 2, 0, 0]}
      scale={[0.3, 0.3, 0.3]}
      {...props}
    >
      <geometry vertices={arrowVertices} faces={arrowFaces} attach="geometry" />
      <meshBasicMaterial wireframe color={0xffffff} attach="material" />
    </mesh>
  );
};
