import React from "react";
import {Group} from "three";
import {MeshProps, useFrame} from "react-three-fiber";
import SystemLabel from "./SystemLabel";
import SystemCircle, {DraggableSystemCircle} from "./SystemCircle";
import {UniverseSubscription} from "../../../generated/graphql";
const SystemMarker: React.FC<
  {
    system: NonNullable<UniverseSubscription["pluginUniverse"]>[0];
    name: string;
    position: [number, number, number];
    draggable?: boolean;
    onPointerDown?: () => void;
  } & MeshProps
> = ({system, name, position, draggable, ...props}) => {
  const group = React.useRef<Group>(new Group());

  const direction = React.useRef(0);

  useFrame(({camera, mouse}) => {
    const zoom = group.current?.position
      ? camera.position.distanceTo(group.current?.position)
      : 1;
    let zoomedScale = (zoom / 2) * 0.015;
    group.current?.scale.set(zoomedScale, zoomedScale, zoomedScale);
    group.current?.quaternion.copy(camera.quaternion);
  });

  return (
    <>
      <group position={position} ref={group}>
        {draggable ? (
          <DraggableSystemCircle
            system={system}
            hoveringDirection={direction}
            parentObject={group}
            {...props}
            onPointerOver={e => {
              props?.onPointerOver?.(e);
              direction.current = 1;
              document.body.style.cursor = "pointer";
            }}
            onPointerOut={e => {
              props?.onPointerOut?.(e);
              direction.current = -1;
              document.body.style.cursor = "auto";
            }}
          />
        ) : (
          <SystemCircle
            system={system}
            hoveringDirection={direction}
            {...props}
            onPointerOver={e => {
              props?.onPointerOver?.(e);
              direction.current = 1;
              document.body.style.cursor = "pointer";
            }}
            onPointerOut={e => {
              props?.onPointerOut?.(e);
              direction.current = -1;
              document.body.style.cursor = "auto";
            }}
          />
        )}
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
