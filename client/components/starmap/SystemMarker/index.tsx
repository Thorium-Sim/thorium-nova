import React from "react";
import {Group} from "three";
import {useFrame} from "react-three-fiber";
import SystemLabel from "./SystemLabel";
import SystemCircle from "./SystemCircle";
import {UniverseSubscription} from "../../../generated/graphql";
const SystemMarker: React.FC<{
  id: string;
  system: NonNullable<UniverseSubscription["universe"]>["systems"][0];
  name: string;
  position: [number, number, number];
}> = ({id, system, name, position}) => {
  const group = React.useRef<Group>(new Group());

  const direction = React.useRef(0);

  useFrame(({camera, mouse}) => {
    const zoom = camera.position.distanceTo(group.current.position);
    let zoomedScale = (zoom / 2) * 0.015;
    group.current.scale.set(zoomedScale, zoomedScale, zoomedScale);
    group.current.quaternion.copy(camera.quaternion);
  });

  return (
    <>
      <group position={position} ref={group}>
        <SystemCircle
          system={system}
          hoveringDirection={direction}
          parent={group}
        />
        <SystemLabel
          systemId={system.id}
          hoveringDirection={direction}
          name={name}
        />
      </group>
    </>
  );
};

export default SystemMarker;
