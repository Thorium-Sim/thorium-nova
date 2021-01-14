import {useRef} from "react";
import {useShipsStore} from "client/components/viewscreen/useSystemShips";
import {useTexture} from "drei";
import {Group, Sprite, Texture} from "three";
import {useFrame} from "react-three-fiber";
import {itemEvents} from "./utils";

export const NavigationShipEntity = ({
  entityId,
  playerId,
}: {
  entityId: string;
  playerId?: string;
}) => {
  const entity = useShipsStore.getState()[entityId];
  // TODO: Replace with a ship icon.
  const spriteMap = useTexture("/assets/icons/Pyramid.svg") as Texture;
  const scale = 1 / 20;
  const sprite = useRef<Sprite>(null);
  const group = useRef<Group>();

  useFrame(({camera}) => {
    const ship = useShipsStore.getState()[entityId];

    if (!ship) return;
    if (ship.position) {
      sprite.current?.position.set(
        ship.position.x,
        ship.position.y,
        ship.position.z
      );
      let zoom = 0;
      if (sprite.current) {
        zoom = camera.position.distanceTo(sprite.current.position) + 500;
        let zoomedScale = (zoom / 2) * scale;
        sprite.current.scale.set(zoomedScale, zoomedScale, zoomedScale);
      }
      if (group.current) {
        if (sprite.current) {
          group.current.position.copy(sprite.current?.position);
        }
        let zoomedScale = (zoom / 2) * 0.01;
        group.current.scale.set(zoomedScale, zoomedScale, zoomedScale);
        group.current.quaternion.copy(camera.quaternion);
      }
    }
  });
  if (!entity) return null;
  return (
    <group {...itemEvents(entity)}>
      <sprite ref={sprite}>
        <spriteMaterial
          attach="material"
          map={spriteMap}
          color={"white"}
          sizeAttenuation={true}
        ></spriteMaterial>
      </sprite>
      {/* <group ref={group} scale={[0.2, 0.2, 0.2]}>
        <SystemLabel
          systemId=""
          name={entity.identity.name}
          hoveringDirection={{current: 0}}
          scale={5 / 128}
        />
      </group> */}
    </group>
  );
};
