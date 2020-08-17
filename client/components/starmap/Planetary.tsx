import {useTemplateSystemSubscription} from "../../generated/graphql";
import React from "react";
import {useThree} from "react-three-fiber";
import {Vector3} from "three";
import StarEntity from "./entities/StarEntity";
import PlanetEntity from "./entities/PlanetEntity";

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

  return (
    <>
      {data?.templateUniverseSystem.items.map(e => {
        if (e.isStar) {
          return <StarEntity key={e.id} entity={e} />;
        }
        if (e.isPlanet) {
          return <PlanetEntity key={e.id} entity={e} />;
        }
        return null;
      })}
    </>
  );
};
export default Planetary;
