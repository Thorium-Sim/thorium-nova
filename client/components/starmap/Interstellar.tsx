import {useUniverseSubscription} from "../../generated/graphql";
import React, {Suspense} from "react";
import SystemMarker from "./SystemMarker";
import {useParams} from "react-router";
import {configStoreApi} from "./configStore";

const Interstellar = () => {
  const [universeId, setUniverseId] = React.useState("");

  const {data} = useUniverseSubscription({
    variables: {id: universeId},
    skip: !universeId,
  });
  React.useEffect(() => {
    setUniverseId(configStoreApi.getState().universeId);
    const unsub = configStoreApi.subscribe(
      universeId => {
        setUniverseId(universeId as string);
      },
      state => state.universeId
    );
    return () => unsub();
  }, []);
  return (
    <React.Suspense fallback={null}>
      {data?.universe?.systems.map(s => (
        <SystemMarker
          key={s.id}
          id={s.id}
          position={[s.position.x, s.position.y, s.position.z]}
          name={s.identity.name}
        />
      ))}
    </React.Suspense>
  );
};

export default Interstellar;
