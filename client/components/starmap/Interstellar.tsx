import {useUniverseSubscription} from "../../generated/graphql";
import React from "react";
import SystemMarker from "./SystemMarker";
import {useParams} from "react-router";
import Starfield from "./Starfield";

const Interstellar = () => {
  const {universeId} = useParams();

  const {data} = useUniverseSubscription({
    variables: {id: universeId},
    skip: !universeId,
  });

  return (
    <React.Suspense fallback={null}>
      <Starfield />

      {data?.universe?.systems.map(s => (
        <SystemMarker
          key={s.id}
          id={s.id}
          star={s}
          position={[s.position.x, s.position.y, s.position.z]}
          name={s.identity.name}
        />
      ))}
    </React.Suspense>
  );
};

export default Interstellar;
