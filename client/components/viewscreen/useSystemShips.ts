import React from "react";
import {useConfigStore} from "../starmap/configStore";
import {
  UniverseSystemShipsSubscription,
  useUniverseSystemShipsSubscription,
  UniverseSystemShipsHotDocument,
  UniverseSystemShipsHotSubscription,
  useFlightPlayerShipSubscription,
} from "../../generated/graphql";
import create from "zustand";
import {useApolloClient} from "@apollo/client";
import produce from "immer";
import {singletonHook} from "react-singleton-hook";

type ShipMap = Record<
  string,
  UniverseSystemShipsSubscription["universeSystemShips"][0]
>;
export const useShipsStore = create<ShipMap>(() => ({}));

export const useSystemShips = singletonHook([], function useSystemShipsHook() {
  const {data: flightPlayerData} = useFlightPlayerShipSubscription();
  const systemId =
    flightPlayerData?.playerShip.interstellarPosition?.system?.id;
  const autopilotIncluded = useConfigStore(store => store.includeAutopilotData);
  const {data} = useUniverseSystemShipsSubscription({
    variables: {systemId: systemId || ""},
    skip: !systemId,
  });
  const [shipIds, setShipIds] = React.useState<string[]>([]);
  const ships = data?.universeSystemShips;
  React.useEffect(() => {
    const newState =
      ships?.reduce((prev: ShipMap, next) => {
        prev[next.id] = next;
        return prev;
      }, {}) || {};
    useShipsStore.setState(newState, true);
    setShipIds(Object.keys(newState));
  }, [ships]);

  // TODO: Implement Linear Interpolation
  const client = useApolloClient();
  React.useEffect(() => {
    if (!systemId) return;
    if (window.location.protocol === "https:") {
      //|| window.location.host === "localhost") {
      // TODO: Implement Geckos
    } else {
      const unsub = client
        .subscribe({
          query: UniverseSystemShipsHotDocument,
          variables: {
            systemId,
            autopilotIncluded,
          },
        })
        .subscribe({
          next({data}: {data?: UniverseSystemShipsHotSubscription}) {
            if (!data) return;
            setShipIds(ids => {
              if (data.universeSystemShipsHot.length !== ids.length) {
                return data.universeSystemShipsHot.map(s => s.id);
              }
              return ids;
            });
            useShipsStore.setState(store =>
              produce(store, draft => {
                data.universeSystemShipsHot.forEach(ship => {
                  if (draft[ship.id]?.position) {
                    draft[ship.id].position = ship.position;
                  }
                  if (draft[ship.id]?.rotation) {
                    draft[ship.id].rotation = ship.rotation;
                  }
                  if (draft[ship.id]?.autopilot) {
                    draft[ship.id].autopilot = ship.autopilot;
                  }
                });
              })
            );
          },
          error(err) {
            console.error("Ship Update Error", err);
          },
        });
      return () => unsub.unsubscribe();
    }
  }, [systemId, setShipIds, autopilotIncluded, client]);
  return shipIds;
});
