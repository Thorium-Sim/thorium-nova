import {useRef} from "react";
import {useFrame} from "react-three-fiber";
import {Texture, Group} from "three";
import {useTexture} from "drei";
import type {EntityType} from "./utils";

export const NavigationWaypointEntity = ({entity}: {entity: EntityType}) => {
  const color = "rgb(230,153,0)";
  const spriteMap = useTexture(require("./Waypoint.svg").default) as Texture;
  const strokeMap = useTexture(
    require("./WaypointStroke.svg").default
  ) as Texture;
  const group = useRef<Group>();
  const scale = 1 / 10;

  useFrame(({camera}) => {
    if (!entity) return;
    if (entity.position) {
      group.current?.position.set(
        entity.position.x,
        entity.position.y,
        entity.position.z
      );
      let zoom = 0;
      if (group.current) {
        zoom = camera.position.distanceTo(group.current.position) + 500;
        let zoomedScale = (zoom / 2) * scale;
        group.current.scale.set(zoomedScale, zoomedScale, zoomedScale);
      }
    }
  });
  if (!entity) return null;
  return (
    <group ref={group} renderOrder={100}>
      <sprite renderOrder={101} position={[0, 0, -0.5]}>
        <spriteMaterial
          attach="material"
          map={spriteMap}
          color={color}
          sizeAttenuation={true}
        ></spriteMaterial>
      </sprite>
      <sprite renderOrder={100} position={[0, 0, -0.5]}>
        <spriteMaterial
          attach="material"
          map={strokeMap}
          color={"rgb(110,73,0)"}
          sizeAttenuation={true}
        ></spriteMaterial>
      </sprite>
    </group>
  );
};
