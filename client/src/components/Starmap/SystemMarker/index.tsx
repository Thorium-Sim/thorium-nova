import React from "react";
import {Group} from "three";
import SystemLabel from "./SystemLabel";
import SystemCircle, {DraggableSystemCircle} from "./SystemCircle";
import {MeshProps, useFrame} from "@react-three/fiber";
const SystemMarker: React.FC<
  {
    systemId: string;
    name: string;
    position: [number, number, number];
    draggable?: boolean;
    onPointerDown?: () => void;
  } & MeshProps
> = ({systemId, name, position, draggable, ...props}) => {
  const group = React.useRef<Group>(new Group());

  const direction = React.useRef(0);

  useFrame(({camera}) => {
    const zoom = group.current?.position
      ? camera.position.distanceTo(group.current?.position)
      : 1;

    let zoomedScale = Math.max(
      Math.min(zoom ** (1 / 3) * 5000, zoom / 120),
      zoom / 250
    );

    group.current?.scale.set(zoomedScale, zoomedScale, zoomedScale);
    group.current?.quaternion.copy(camera.quaternion);
  });

  return (
    <>
      <group position={position} ref={group}>
        {draggable ? (
          <DraggableSystemCircle
            systemId={systemId}
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
            systemId={systemId}
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
          systemId={systemId}
          hoveringDirection={direction}
          name={name}
        />
      </group>
    </>
  );
};

export default SystemMarker;
