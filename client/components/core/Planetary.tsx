import React, {memo, Suspense} from "react";
import {useFrame} from "react-three-fiber";
import {useUniverseSystemSubscription} from "../../generated/graphql";
import {configStoreApi, useConfigStore} from "../starmap/configStore";
import StarEntity from "../starmap/entities/StarEntity";
import PlanetEntity from "../starmap/entities/PlanetEntity";
import {useSystemShips} from "../viewscreen/useSystemShips";
import {Group} from "three";
import {ErrorBoundary} from "react-error-boundary";
import ShipEntity from "../starmap/entities/ShipEntity";

export const StarmapCorePlanetary: React.FC = memo(() => {
  const systemId = useConfigStore(store => store.systemId);
  const planetsGroup = React.useRef<Group>();
  React.useEffect(() => {
    configStoreApi.setState({systemId: "ew1d9kfkfhc49g2", viewingMode: "core"});
  }, []);

  const {data} = useUniverseSystemSubscription({
    variables: {systemId},
    skip: !systemId,
  });
  const system = data?.universeSystem;

  const skyboxKey = system?.planetarySystem?.skyboxKey || "blank";
  React.useEffect(() => {
    configStoreApi.setState({skyboxKey});
  }, [skyboxKey]);
  const ids = useSystemShips();

  useFrame(() => {
    if (planetsGroup.current) {
      // Hide planets if that option is set
      if (useConfigStore.getState().hidePlanets) {
        planetsGroup.current.visible = false;
      } else {
        planetsGroup.current.visible = true;
      }
    }
  });
  return (
    <>
      <group ref={planetsGroup}>
        {system?.items.map(e => {
          if (e.isStar) {
            return <StarEntity key={e.id} entity={e} />;
          }
          if (e.isPlanet) {
            return <PlanetEntity key={e.id} entity={e} />;
          }
          return null;
        })}
      </group>
      {ids.map(shipId => (
        <Suspense key={shipId} fallback={null}>
          <ErrorBoundary
            FallbackComponent={() => <></>}
            onError={err => console.error(err)}
          >
            <ShipEntity entityId={shipId} />
          </ErrorBoundary>
        </Suspense>
      ))}
    </>
  );
});
