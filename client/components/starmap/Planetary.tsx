import {useTemplateSystemSubscription} from "../../generated/graphql";
import React from "react";
import {useThree} from "react-three-fiber";
import {MOUSE, Vector3} from "three";
import StarEntity from "./entities/StarEntity";
import PlanetContainer from "./entities/PlanetEntity";
import Disc from "./Disc";
import {configStoreApi} from "./configStore";
import {OrbitControls} from "./OrbitControls";

export function useSetupOrbit() {
  const orbitControls = React.useRef<OrbitControls>();

  React.useEffect(() => {
    configStoreApi.setState({
      orbitControlsTrackPosition: (
        position: Vector3,
        distance: number = 50
      ) => {
        if (orbitControls.current) {
          orbitControls.current.target0?.copy(position);
          orbitControls.current.position0.copy(
            position
              .clone()
              // We have to add some so our distance can be properly applied
              // when the star is at 0,0,0
              .addScalar(1)
              .normalize()
              .multiplyScalar(distance)
              .add(position)
              .add(new Vector3(0, 10, 0))
          );
          orbitControls.current.reset?.();
        }
      },
    });

    // Indicate the transition is complete
    configStoreApi.getState().transitionPromise?.();
  }, []);
  return orbitControls;
}
// 1 unit = 1 million km
const Planetary: React.FC<{universeId: string; systemId: string}> = ({
  universeId,
  systemId,
}) => {
  const {camera} = useThree();

  const orbitControls = useSetupOrbit();
  const {data} = useTemplateSystemSubscription({
    variables: {id: universeId, systemId},
  });
  React.useEffect(() => {
    camera.position.set(0, 200, 500);
    camera.lookAt(new Vector3(0, 0, 0));
  }, []);

  const system = data?.pluginUniverseSystem;
  React.useEffect(() => {
    configStoreApi.setState({currentSystem: system});
    return () => {
      configStoreApi.setState({currentSystem: null});
    };
  }, [system]);

  const skyboxKey =
    data?.pluginUniverseSystem.planetarySystem?.skyboxKey || "blank";
  React.useEffect(() => {
    configStoreApi.setState({skyboxKey});
  }, [skyboxKey]);

  const {habitableZoneInner = 0, habitableZoneOuter = 3} =
    data?.pluginUniverseSystem || {};
  const hasStar = !!data?.pluginUniverseSystem.items.find(s => s.isStar);
  const scale = 1 / 1000000;
  return (
    <>
      <OrbitControls
        ref={orbitControls}
        maxDistance={15000}
        minDistance={1}
        mouseButtons={{
          LEFT: MOUSE.ROTATE,
          RIGHT: MOUSE.PAN,
          MIDDLE: MOUSE.DOLLY,
        }}
      />
      {hasStar && data?.pluginUniverseSystem.planetarySystem && (
        <Disc
          habitableZoneInner={habitableZoneInner}
          habitableZoneOuter={habitableZoneOuter}
          scale={[scale, scale, scale]}
        />
      )}
      {data?.pluginUniverseSystem.items.map(e => {
        if (e.isStar) {
          return <StarEntity key={e.id} entity={e} />;
        }
        if (e.isPlanet) {
          return <PlanetContainer key={e.id} entity={e} />;
        }
        return null;
      })}
    </>
  );
};
export default Planetary;
