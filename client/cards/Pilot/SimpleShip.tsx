import {useShipsStore} from "client/components/viewscreen/useSystemShips";
import {Line, useGLTFLoader, useTextureLoader} from "drei";
import {Fragment, useMemo, useRef} from "react";
import {useFrame} from "react-three-fiber";
import {
  Mesh,
  Plane,
  OrthographicCamera,
  Quaternion,
  Sprite,
  Vector3,
  Texture,
  DoubleSide,
  Group,
  Object3D,
  MeshBasicMaterial,
} from "three";
import {Line2} from "three/examples/jsm/lines/Line2";

const zeroVector = new Vector3();
const upVector = new Vector3(0, 1, 0);
const playerQuaternion = new Quaternion();
const plane = new Plane();
export const ShipEntity = ({
  entityId,
  playerId,
  tilted,
}: {
  entityId: string;
  playerId?: string;
  tilted?: boolean;
}) => {
  const entity = useShipsStore.getState()[entityId];

  const modelAsset = entity?.shipAssets?.model;

  const model = useGLTFLoader(modelAsset || "", false);

  const scene = useMemo(() => {
    const scene: Group = model.scene.clone(true);
    if (scene.traverse) {
      scene.traverse(function (object: Object3D | Mesh) {
        if ("material" in object) {
          object.material = new MeshBasicMaterial({
            color: "white",
            wireframe: true,
          });
        }
      });
    }

    return scene;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [modelAsset]);
  // TODO: Replace with a ship icon.
  const spriteMap = useTextureLoader("/assets/icons/Pyramid.svg") as Texture;
  const scale = 1 / 50;
  const mesh = useRef<Mesh>(null);
  const line = useRef<Line2>(null);
  const sprite = useRef<Sprite>(null);
  const shipRef = useRef<Group>(null);
  useFrame(props => {
    const camera = props.camera as OrthographicCamera;
    const dx = (camera.right - camera.left) / (2 * camera.zoom);
    const ship = useShipsStore.getState()[entityId];
    const playerShip = useShipsStore.getState()[playerId || ""];
    const playerPosition = playerShip.position || zeroVector;

    if (!ship) return;
    if (shipRef.current) {
      if (ship.size?.value && dx / ship.size.value < 50) {
        if (sprite.current) {
          sprite.current.visible = false;
        }
        shipRef.current.visible = true;
      } else {
        if (sprite.current) {
          sprite.current.visible = true;
        }
        shipRef.current.visible = false;
      }
    }
    if (ship.position) {
      // Since the sensor grid needs to be oriented at 0,0,0
      // to properly tilt, we reposition the contacts relative
      // to the player ship's position.
      sprite.current?.position.set(
        ship.position.x - playerPosition.x,
        ship.position.y - playerPosition.y,
        ship.position.z - playerPosition.z
      );
      if (sprite.current?.position) {
        shipRef.current?.position.copy(sprite.current?.position);
      }
      shipRef.current?.scale.setScalar(ship.size?.value || 1);
      if (ship.rotation) {
        shipRef.current?.quaternion.set(
          ship.rotation.x,
          ship.rotation.y,
          ship.rotation.z,
          ship.rotation.w
        );
      }
      if (
        playerShip.rotation &&
        sprite.current?.position &&
        mesh.current?.position
      ) {
        const planeVector = upVector
          .clone()
          .applyQuaternion(
            playerQuaternion.set(
              playerShip.rotation.x,
              playerShip.rotation.y,
              playerShip.rotation.z,
              playerShip.rotation.w
            )
          );
        plane.set(planeVector, 0);
        plane.projectPoint(sprite.current.position, mesh.current.position);
        const positions = [
          ...sprite.current.position.toArray(),
          ...mesh.current.position.toArray(),
        ];
        line.current?.geometry.setPositions(positions);
        if (mesh.current && line.current)
          if (tilted) {
            mesh.current.visible = true;
            line.current.visible = true;
          } else {
            mesh.current.visible = false;
            line.current.visible = false;
          }
      }
    }
    sprite.current?.scale.setScalar(dx * 3 * scale);

    mesh.current?.scale.setScalar(dx * 3);
    if (playerShip.rotation) {
      mesh.current?.quaternion.set(
        playerShip.rotation.x,
        playerShip.rotation.y,
        playerShip.rotation.z,
        playerShip.rotation.w
      );
      mesh.current?.rotateX(Math.PI / 2);
    }
  });

  return (
    <Fragment>
      <group ref={shipRef}>
        <primitive object={scene} rotation={[Math.PI / 2, Math.PI, 0]} />
      </group>
      {entityId !== playerId && (
        <Fragment>
          <sprite ref={sprite}>
            <spriteMaterial
              attach="material"
              map={spriteMap}
              color={"white"}
              sizeAttenuation={true}
            ></spriteMaterial>
          </sprite>
          <Line
            ref={line}
            points={[
              [0, 0, 0],
              [0, 0, 0],
            ]}
            color={"white"}
            lineWidth={1}
          ></Line>
          <mesh ref={mesh}>
            <planeBufferGeometry args={[0.01, 0.01]} attach="geometry" />
            <meshBasicMaterial
              attach="material"
              color="white"
              side={DoubleSide}
            />
          </mesh>
        </Fragment>
      )}
    </Fragment>
  );
};
