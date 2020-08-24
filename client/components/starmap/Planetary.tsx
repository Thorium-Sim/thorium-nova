import {useTemplateSystemSubscription} from "../../generated/graphql";
import React from "react";
import {useThree} from "react-three-fiber";
import {Vector3} from "three";
import StarEntity from "./entities/StarEntity";
import PlanetContainer from "./entities/PlanetEntity";
import Disc from "./Disc";
import {configStoreApi} from "./configStore";

// 1 unit = 1 million km
const Planetary: React.FC<{universeId: string; systemId: string}> = ({
  universeId,
  systemId,
}) => {
  const {camera} = useThree();

  const {data} = useTemplateSystemSubscription({
    variables: {id: universeId, systemId},
  });
  React.useEffect(() => {
    camera.position.set(0, 200, 500);
    camera.lookAt(new Vector3(0, 0, 0));
  }, []);

  const system = data?.templateUniverseSystem;
  React.useEffect(() => {
    configStoreApi.setState({currentSystem: system});
    return () => {
      configStoreApi.setState({currentSystem: null});
    };
  }, [system]);

  const skyboxKey =
    data?.templateUniverseSystem.planetarySystem.skyboxKey || "blank";
  React.useEffect(() => {
    configStoreApi.setState({skyboxKey});
  }, [skyboxKey]);

  const {habitableZoneInner = 0, habitableZoneOuter = 3} =
    data?.templateUniverseSystem || {};
  const hasStar = !!data?.templateUniverseSystem.items.find(s => s.isStar);
  const scale = 1 / 1000000;
  return (
    <>
      {hasStar && data?.templateUniverseSystem.planetarySystem && (
        <Disc
          habitableZoneInner={habitableZoneInner}
          habitableZoneOuter={habitableZoneOuter}
          scale={[scale, scale, scale]}
        />
      )}
      {data?.templateUniverseSystem.items.map(e => {
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
