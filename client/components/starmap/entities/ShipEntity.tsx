import React from "react";
import {useFrame} from "react-three-fiber";
import {Line, useGLTFLoader, useTextureLoader} from "drei";
import {
  Color,
  FrontSide,
  Group,
  Mesh,
  MeshStandardMaterial,
  Object3D,
  Sprite,
  Texture,
  Vector3,
} from "three";
import {useShipsStore} from "../../viewscreen/useSystemShips";
import {whiteImage} from "../utils";
import {useConfigStore} from "../configStore";
import {useSelectedShips} from "../../viewscreen/useSelectedShips";
import {Line2} from "three/examples/jsm/lines/Line2";

const ShipSprite = ({id, color = "white"}: {id: string; color?: string}) => {
  const spriteMap = useTextureLoader(
    "/public/assets/icons/Pyramid.svg"
  ) as Texture;
  const scale = 1 / 50;
  const ref = React.useRef<Sprite>();
  useFrame(() => {
    const isSelected = useSelectedShips.getState().selectedIds.includes(id);
    if (isSelected) {
      ref.current?.material.color.set("#0088ff");
    } else {
      ref.current?.material.color.set(color);
    }
  });
  return (
    <sprite ref={ref} scale={[scale, scale, scale]}>
      <spriteMaterial
        attach="material"
        map={spriteMap}
        color={color}
        sizeAttenuation={false}
      ></spriteMaterial>
    </sprite>
  );
};

const distanceVector = new Vector3();
const ShipEntity: React.FC<{
  entityId: string;
}> = ({entityId}) => {
  const entity = useShipsStore.getState()[entityId];
  if (!entity) return null;
  const modelAsset = entity.shipAssets?.model;
  const model = useGLTFLoader(modelAsset || whiteImage, false);

  const scene = React.useMemo(() => {
    const scene: Group = model.scene.clone(true);
    if (scene.traverse) {
      scene.traverse(function (object: Object3D | Mesh) {
        if ("material" in object) {
          const material = object.material as MeshStandardMaterial;
          material.emissiveMap = material.map;
          material.emissiveIntensity = 0.3;
          material.emissive = new Color(0xffffff);
          material.side = FrontSide;

          object.castShadow = true;
          object.receiveShadow = true;
        }
      });
    }

    return scene;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [modelAsset]);

  const group = React.useRef<Group>();
  const shipMesh = React.useRef<Group>();
  const shipSprite = React.useRef<Group>();
  const lineRef = React.useRef<Line2>(null);

  useFrame(({camera}) => {
    const ship = useShipsStore.getState()[entity.id];
    const compressYDimension =
      useConfigStore.getState().viewingMode === "core"
        ? useConfigStore.getState().compressYDimension
        : false;
    const scale = ship.size.value;
    shipMesh.current?.scale.set(scale, scale, scale);
    group.current?.position.set(
      ship.position.x,
      compressYDimension ? 0 : ship.position.y,
      ship.position.z
    );
    shipMesh.current?.quaternion.set(
      ship.rotation.x,
      ship.rotation.y,
      ship.rotation.z,
      ship.rotation.w
    );
    // camera.position.set(ship.position.x, ship.position.y, ship.position.z);
    // camera.quaternion
    //   .set(ship.rotation.x, ship.rotation.y, ship.rotation.z, ship.rotation.w)
    //   .multiply(new Quaternion(0, 1, 0, 0));

    const distance = camera.position.distanceTo(
      distanceVector.set(camera.position.x, 0, camera.position.z)
    );
    if (shipSprite.current && shipMesh.current) {
      if (scale && distance / scale > 100) {
        shipSprite.current.visible = true;
        shipMesh.current.visible = false;
      } else {
        shipSprite.current.visible = false;
        shipMesh.current.visible = true;
      }
    }
    // Autopilot Destination
    if (lineRef.current && group.current) {
      if (
        useConfigStore.getState().includeAutopilotData &&
        ship.autopilot.desiredCoordinates
      ) {
        lineRef.current.geometry.setPositions([
          group.current.position.x,
          group.current.position.y,
          group.current.position.z,
          ship.autopilot.desiredCoordinates.x,
          ship.autopilot.desiredCoordinates.y,
          ship.autopilot.desiredCoordinates.z,
        ]);
        lineRef.current.geometry.attributes.position.needsUpdate = true;
        lineRef.current.visible = true;
      } else {
        lineRef.current.visible = false;
      }
    }
  });

  return (
    <group>
      <Line
        ref={lineRef}
        points={[
          [1, 1, 1],
          [2, 2, 2],
        ]} // Array of points
        color="white"
        opacity={0.2}
        transparent
        lineWidth={0.25} // In pixels (default)
      />
      <group ref={group}>
        <group ref={shipSprite}>
          <ShipSprite id={entity.id} />
        </group>
        <group ref={shipMesh}>
          {/* <axesHelper args={[3]} /> */}
          <primitive object={scene} rotation={[Math.PI / 2, Math.PI, 0]} />
        </group>
      </group>
    </group>
  );
};

export default ShipEntity;
