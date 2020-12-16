import {useSystemShips} from "client/components/viewscreen/useSystemShips";
import {
  useFlightPlayerShipSubscription,
  useUniverseSystemSubscription,
} from "client/generated/graphql";
import {Fragment, memo, Suspense} from "react";
import {ErrorBoundary} from "react-error-boundary";
import {PlanetaryEntity} from "./SimplePlanet";
import {ShipEntity} from "./SimpleShip";

export const PilotContacts = memo(({tilted}: {tilted: boolean}) => {
  const {data: flightPlayerData} = useFlightPlayerShipSubscription();
  const systemId =
    flightPlayerData?.playerShip.interstellarPosition?.system?.id;
  const {data} = useUniverseSystemSubscription({
    variables: {systemId: systemId || ""},
    skip: !systemId,
  });
  const system = data?.universeSystem;
  const shipIds = useSystemShips(systemId || "");
  if (!flightPlayerData?.playerShip) return null;
  return (
    <group>
      {system?.items.map(e => {
        if (e.isStar || e.isPlanet) {
          return (
            <PlanetaryEntity
              key={e.id}
              entity={e}
              playerId={flightPlayerData.playerShip.id}
            />
          );
        }
        return null;
      })}
      {shipIds.map(shipId => {
        return (
          <Suspense key={shipId} fallback={null}>
            <ErrorBoundary
              FallbackComponent={() => <Fragment></Fragment>}
              onError={err => console.error(err)}
            >
              <ShipEntity
                entityId={shipId}
                playerId={flightPlayerData.playerShip.id}
                tilted={tilted}
              />
            </ErrorBoundary>
          </Suspense>
        );
      })}
    </group>
  );
});
