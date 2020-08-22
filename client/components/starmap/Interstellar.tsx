import {useUniverseSubscription} from "../../generated/graphql";
import React from "react";
import SystemMarker from "./SystemMarker";
import Starfield from "./Starfield";
import {configStoreApi} from "./configStore";

const Interstellar: React.FC<{universeId: string}> = ({universeId}) => {
  const {data} = useUniverseSubscription({
    variables: {id: universeId},
    skip: !universeId,
  });

  React.useEffect(() => {
    configStoreApi.setState({skyboxKey: "blank"});
  }, []);
  return (
    <React.Suspense fallback={null}>
      <Starfield />

      {data?.universe?.systems.map(s => (
        <SystemMarker
          key={s.id}
          id={s.id}
          system={s}
          position={[s.position.x, s.position.y, s.position.z]}
          name={s.identity.name}
        />
      ))}
    </React.Suspense>
  );
};

export default Interstellar;
