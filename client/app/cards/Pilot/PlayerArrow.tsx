import {type Object3DNode, useFrame} from "@react-three/fiber";
import {type FC, useMemo, useRef} from "react";
import {BufferGeometry, type Mesh, type OrthographicCamera, Vector3} from "three";

const arrowVertices = [
  new Vector3(0, 0, -0.75),
  new Vector3(0.5, 0, 0.65),
  new Vector3(0, 0.25, 0.2),
  new Vector3(-0.5, 0, 0.65),
  new Vector3(0, -0.25, 0.2),
];

const points = [
  arrowVertices[0],
  arrowVertices[2],
  arrowVertices[1],
  arrowVertices[0],
  arrowVertices[3],
  arrowVertices[2],
  arrowVertices[0],
  arrowVertices[1],
  arrowVertices[4],
  arrowVertices[0],
  arrowVertices[4],
  arrowVertices[3],
  arrowVertices[2],
  arrowVertices[4],
  arrowVertices[1],
  arrowVertices[2],
  arrowVertices[3],
  arrowVertices[4],
];
export const PlayerArrow: FC<Object3DNode<any, any>> = props => {
  const ref = useRef<Mesh>(null);
  useFrame(props => {
    const camera = props.camera as OrthographicCamera;
    const dx = (camera.right - camera.left) / (2 * camera.zoom);
    ref.current?.scale.setScalar(dx * 0.1);
  });

  const geometry = useMemo(() => {
    const geo = new BufferGeometry();
    geo.setFromPoints(points);
    geo.computeVertexNormals();
    return geo;
  }, []);
  return (
    <mesh
      ref={ref}
      rotation={[0, 0, 0]}
      scale={[0.3, 0.3, 0.3]}
      {...props}
      geometry={geometry}
    >
      <meshBasicMaterial wireframe color={0xffffff} attach="material" />
    </mesh>
  );
};
