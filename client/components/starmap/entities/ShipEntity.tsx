import React from "react";
import {useFrame, useThree} from "react-three-fiber";
import {Line, useGLTFLoader, useTextureLoader} from "drei";
import {
  Color,
  FrontSide,
  Group,
  Mesh,
  MeshStandardMaterial,
  Object3D,
  Quaternion,
  Sprite,
  Texture,
  Vector3,
} from "three";
import {useShipsStore} from "../../viewscreen/useSystemShips";
import {useConfigStore} from "../configStore";
import {useSelectedShips} from "../../viewscreen/useSelectedShips";
import {Line2} from "three/examples/jsm/lines/Line2";
import {useDrag} from "react-use-gesture";
import {
  useShipsSetDesiredDestinationMutation,
  useShipsSetPositionMutation,
} from "client/generated/graphql";
import {useTranslate2DTo3D} from "client/helpers/hooks/use2Dto3D";
import {usePlayerShipId} from "client/components/viewscreen/PlayerShipContext";

const ShipSprite = ({id, color = "white"}: {id: string; color?: string}) => {
  const spriteMap = useTextureLoader("/assets/icons/Pyramid.svg") as Texture;
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

const ShipEntityWrapper: React.FC<{entityId: string}> = ({entityId}) => {
  const entity = useShipsStore.getState()[entityId];
  if (!entity) return null;
  return <ShipEntity entityId={entityId} />;
};

const forwardQuaternion = new Quaternion(0, 1, 0, 0);
const distanceVector = new Vector3();
const ShipEntity: React.FC<{
  entityId: string;
}> = ({entityId}) => {
  const entity = useShipsStore.getState()[entityId];
  const modelAsset = entity?.shipAssets?.model;
  const model = useGLTFLoader(modelAsset || "", false);
  const shipId = usePlayerShipId();

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

  const [setPosition] = useShipsSetPositionMutation();
  const [setDestination] = useShipsSetDesiredDestinationMutation();

  useFrame(({camera}) => {
    const ship = useShipsStore.getState()[entity.id];
    const compressYDimension =
      useConfigStore.getState().viewingMode === "core"
        ? useConfigStore.getState().compressYDimension
        : false;
    const scale = ship.size?.value || 1;
    shipMesh.current?.scale.set(scale, scale, scale);
    const cachedPosition = useSelectedShips.getState().cachedPositions[
      entity.id
    ];
    const offset = useConfigStore.getState().draggingMovement3D;
    if (ship.position) {
      if (
        useSelectedShips.getState().selectedIds.includes(entity.id) &&
        cachedPosition &&
        offset
      ) {
        group.current?.position.set(
          cachedPosition.x + offset.x,
          compressYDimension ? 0 : cachedPosition.y + offset.y,
          cachedPosition.z + offset.z
        );
      } else {
        group.current?.position.set(
          ship.position.x,
          compressYDimension ? 0 : ship.position.y,
          ship.position.z
        );
      }
    }
    if (ship.rotation) {
      shipMesh.current?.quaternion.set(
        ship.rotation.x,
        ship.rotation.y,
        ship.rotation.z,
        ship.rotation.w
      );
    }
    if (shipId === entityId && ship.position && ship.rotation) {
      camera.position.set(ship.position.x, ship.position.y, ship.position.z);
      camera.quaternion
        .set(ship.rotation.x, ship.rotation.y, ship.rotation.z, ship.rotation.w)
        .multiply(forwardQuaternion);
    }

    const distance = camera.position.distanceTo(
      distanceVector.set(camera.position.x, 0, camera.position.z)
    );
    if (shipSprite.current && shipMesh.current) {
      if (shipId === entityId) {
        shipMesh.current.visible = false;
        shipSprite.current.visible = true;
      } else if (
        scale &&
        distance / scale > 100 &&
        useConfigStore.getState().viewingMode !== "viewscreen"
      ) {
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
  const to3D = useTranslate2DTo3D();
  const {size, camera} = useThree();
  const bind = useDrag(({dragging, movement, first}) => {
    const offsetPosition = to3D(
      movement[0] + size.width / 2,
      movement[1] + size.height / 2
    );

    if (dragging === false) {
      const positions = Object.values(useShipsStore.getState()).reduce(
        (
          prev: {id: string; position: {x: number; y: number; z: number}}[],
          next
        ) => {
          if (useSelectedShips.getState().selectedIds.includes(next.id)) {
            if (next.position) {
              prev.push({
                id: next.id,
                position: {
                  x: next.position.x + (offsetPosition.x - camera.position.x),
                  y: useConfigStore.getState().yDimensionIndex,
                  z: next.position.z + (offsetPosition.z - camera.position.z),
                },
              });
            }
          }
          return prev;
        },
        []
      );
      if (useConfigStore.getState().instantMoveObjects) {
        setPosition({variables: {shipPositions: positions}});
      } else {
        setDestination({variables: {shipPositions: positions}});
      }
      useConfigStore.setState({draggingMovement3D: null});
      useSelectedShips.setState({cachedPositions: {}});
      return;
    }

    if (first) {
      useSelectedShips.setState(({selectedIds}) => ({
        cachedPositions: Object.values(useShipsStore.getState()).reduce(
          (prev: {[id: string]: {x: number; y: number; z: number}}, next) => {
            if (selectedIds.includes(next.id)) {
              if (next.position) {
                prev[next.id] = next.position;
              }
            }
            return prev;
          },
          {}
        ),
      }));
    }
    useConfigStore.setState({
      draggingMovement3D: {
        x: offsetPosition.x - camera.position.x,
        y: offsetPosition.y,
        z: offsetPosition.z - camera.position.z,
      },
    });
  }, {});
  const functions = bind();

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
      <group
        ref={group}
        {...functions}
        onPointerDown={e => {
          if (e.metaKey || e.shiftKey) {
            useSelectedShips.setState(({selectedIds}) => ({
              selectedIds: selectedIds.includes(entity.id)
                ? selectedIds.filter(e => e !== entity.id)
                : selectedIds.concat(entity.id),
            }));
          } else {
            if (!useSelectedShips.getState().selectedIds.includes(entity.id)) {
              useSelectedShips.setState({selectedIds: [entity.id]});
            }
          }
          useConfigStore.getState().disableOrbitControls();

          document.addEventListener(
            "mouseup",
            () => {
              useConfigStore.getState().enableOrbitControls();
            },
            {once: true}
          );
          functions.onPointerDown?.(e);
        }}
      >
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

export default ShipEntityWrapper;
