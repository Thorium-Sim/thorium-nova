import React from "react";
import {useConfigStore} from "../starmap/configStore";
import {
  UniverseSystemShipsSubscription,
  useUniverseSystemShipsSubscription,
  UniverseSystemShipsHotDocument,
  UniverseSystemShipsHotSubscription,
} from "../../generated/graphql";
import create from "zustand";
import {useApolloClient} from "@apollo/client";
import produce from "immer";

type ShipMap = Record<
  string,
  UniverseSystemShipsSubscription["universeSystemShips"][0]
>;
export const useShipsStore = create<ShipMap>(() => ({}));

export function useSystemShips() {
  const systemId = useConfigStore(store => store.systemId);
  const {data} = useUniverseSystemShipsSubscription({variables: {systemId}});
  const ships = data?.universeSystemShips;
  React.useEffect(() => {
    const newState =
      ships?.reduce((prev: ShipMap, next) => {
        prev[next.id] = next;
        return prev;
      }, {}) || {};
    useShipsStore.setState(newState, true);
  }, [ships]);

  const client = useApolloClient();
  React.useEffect(() => {
    if (window.location.protocol === "https:") {
      //|| window.location.host === "localhost") {
    } else {
      const unsub = client
        .subscribe({
          query: UniverseSystemShipsHotDocument,
          variables: {
            systemId,
          },
        })
        .subscribe({
          next({data}: {data: UniverseSystemShipsHotSubscription}) {
            useShipsStore.setState(store =>
              produce(store, draft => {
                data.universeSystemShipsHot.forEach(ship => {
                  if (draft[ship.id]?.position) {
                    draft[ship.id].position = ship.position;
                  }
                  if (draft[ship.id]?.rotation) {
                    draft[ship.id].rotation = ship.rotation;
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
  }, [systemId]);
}
