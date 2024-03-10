import React from "react";
import {Group, Vector3} from "three";
import SystemLabel from "./SystemLabel";
import SystemCircle, {DraggableSystemCircle} from "./SystemCircle";
import {type MeshProps, useFrame} from "@react-three/fiber";
import {useGetStarmapStore} from "../starmapStore";
const SystemMarker: React.FC<
  {
    systemId: string | number;
    name: string;
    position: [number, number, number];
    draggable?: boolean;
    onPointerDown?: () => void;
  } & MeshProps
> = ({systemId, name, position, draggable, ...props}) => {
  const group = React.useRef<Group>(new Group());
  const useStarmapStore = useGetStarmapStore();

  const direction = React.useRef(0);
  const cameraView = useStarmapStore(state => state.cameraView);

  useFrame(({camera}) => {
    const zoom = group.current?.position
      ? camera.position.distanceTo(group.current?.position)
      : 1;

    const zoomedScale = Math.max(
      Math.min(zoom ** (1 / 3) * 5000, zoom / 120),
      zoom / 250
    );

    group.current?.scale.set(zoomedScale, zoomedScale, zoomedScale);
    group.current?.quaternion.copy(camera.quaternion);
  });
  const positionVector = new Vector3(...position);
  if (cameraView === "2d") positionVector.setY(0);
  return (
    <>
      <group position={positionVector} ref={group}>
        {draggable ? (
          <DraggableSystemCircle
            systemId={systemId}
            hoveringDirection={direction}
            parentObject={group}
            position={position}
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
