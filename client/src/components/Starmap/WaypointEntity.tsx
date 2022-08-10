import {useRef} from "react";
import {Texture, Group} from "three";
import {useTexture} from "@react-three/drei";

import WaypointSvg from "./Waypoint.svg";
import WaypointStroke from "./WaypointStroke.svg";
import {useFrame} from "@react-three/fiber";
import type {Coordinates} from "server/src/utils/unitTypes";

export const WaypointEntity = ({position}: {position: Coordinates<number>}) => {
  const color = "rgb(230,153,0)";
  const spriteMap = useTexture(WaypointSvg);
  const strokeMap = useTexture(WaypointStroke);
  const group = useRef<Group>(null);
  const scale = 1 / 10;

  useFrame(({camera}) => {
    if (position) {
      group.current?.position.set(position.x, position.y, position.z);
      let zoom = 0;
      if (group.current) {
        zoom = camera.position.distanceTo(group.current.position) + 500;
        let zoomedScale = (zoom / 2) * scale;
        group.current.scale.set(zoomedScale, zoomedScale, zoomedScale);
      }
    }
  });
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
