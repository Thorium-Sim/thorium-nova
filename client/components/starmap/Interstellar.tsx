import {EntityTypes, useUniverseSubscription} from "../../generated/graphql";
import React from "react";
import SystemMarker from "./SystemMarker";
import Starfield from "./Starfield";
import {configStoreApi} from "./configStore";
import {OrbitControls, OrbitControlsType} from "./OrbitControls";
import {useFrame} from "react-three-fiber";
import {MOUSE, Vector3} from "three";

const Interstellar: React.FC<{universeId: string}> = ({universeId}) => {
  const {data} = useUniverseSubscription({
    variables: {id: universeId},
    skip: !universeId,
  });

  const orbitControls = React.useRef<OrbitControlsType>();
  const frameCount = React.useRef(0);

  useFrame((state, delta) => {
    // Auto rotate, but at a very slow rate, so as to keep the
    // starfield visible
    frameCount.current = (frameCount.current + delta) % 125.663;
    if (orbitControls.current) {
      orbitControls.current.autoRotateSpeed =
        Math.sin(frameCount.current / 100) / 100;
    }
  });
  React.useEffect(() => {
    configStoreApi.setState({
      disableOrbitControls: () => {
        if (orbitControls.current) {
          orbitControls.current.enabled = false;
        }
      },
      enableOrbitControls: () => {
        if (orbitControls.current) {
          orbitControls.current.enabled = true;
        }
      },
      orbitControlsTrackPosition: (position: Vector3) => {
        if (orbitControls.current) {
          orbitControls.current.target0?.copy(position);
          orbitControls.current.position0.copy(
            position.clone().normalize().multiplyScalar(200).add(position)
          );
          orbitControls.current.reset?.();
        }
      },
    });
    // Indicate the transition is complete
    configStoreApi.getState().transitionPromise?.();
  }, []);

  React.useEffect(() => {
    configStoreApi.setState({skyboxKey: "blank"});
  }, []);
  return (
    <React.Suspense fallback={null}>
      <OrbitControls
        ref={orbitControls}
        autoRotate
        maxDistance={1300}
        minDistance={1}
        rotateSpeed={0.5}
        mouseButtons={{
          LEFT: MOUSE.ROTATE,
          RIGHT: MOUSE.PAN,
          MIDDLE: MOUSE.DOLLY,
        }}
      />
      <Starfield />

      {data?.pluginUniverse
        .filter(u => u.entityType === EntityTypes.System)
        .map(s => (
          <SystemMarker
            key={s.id}
            id={s.id}
            system={s}
            position={[
              s.position?.x || 0,
              s.position?.y || 0,
              s.position?.z || 0,
            ]}
            name={s.identity.name}
          />
        ))}
    </React.Suspense>
  );
};

export default Interstellar;
