import React from "react";
import {CanvasTexture, Group} from "three";
import {useFrame} from "react-three-fiber";
import SystemLabel from "./SystemLabel";
import SystemCircle from "./SystemCircle";

const SystemMarker: React.FC<{
  id: string;
  name: string;
  position: [number, number, number];
}> = ({id, name, position}) => {
  const group = React.useRef<Group>(new Group());

  const direction = React.useRef(0);

  useFrame(({camera, mouse}) => {
    const zoom = camera.position.distanceTo(group.current.position);
    let zoomedScale = (zoom / 2) * 0.025;
    group.current.scale.set(zoomedScale, zoomedScale, zoomedScale);
    group.current.quaternion.copy(camera.quaternion);
  });

  return (
    <>
      <group position={position} ref={group} scale={[0.07, 0.07, 0.07]}>
        <SystemCircle
          starId={id}
          hoveringDirection={direction}
          parent={group}
        />
        <SystemLabel hoveringDirection={direction} name={name} />
      </group>
    </>
  );
};

export default SystemMarker;
