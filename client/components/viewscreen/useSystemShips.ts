import React, {useRef} from "react";
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
import useAnimationFrame from "client/helpers/unused/useAnimationFrame";
import {lerp} from "client/helpers/lerp";
import {Quaternion} from "three";

type ShipMap = Record<
  string,
  UniverseSystemShipsSubscription["universeSystemShips"][0]
>;
export const useSystemShipsStore = create<ShipMap>(() => ({}));
let rotationOutput: [number, number, number, number] = [0, 0, 0, 1];

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
    useSystemShipsStore.setState(newState, true);
    setShipIds(Object.keys(newState));
  }, [ships]);
  const previousState = useRef<ShipMap>();
  const nextState = useRef<ShipMap>();
  const timeStamp = useRef(Date.now());
  const timeIntervals = useRef([1]);
  const averageInterval = useRef(1000 / 30);
  useAnimationFrame(() => {
    const t = (Date.now() - timeStamp.current) / averageInterval.current;
    useSystemShipsStore.setState(
      store =>
        produce(store, draft => {
          for (let shipId in draft) {
            const ship = draft[shipId];
            if (!ship) continue;

            ship.position = {
              x: lerp(
                previousState.current?.[shipId].position?.x ?? 0,
                nextState.current?.[shipId].position?.x ?? 0,
                t
              ),
              y: lerp(
                previousState.current?.[shipId].position?.y ?? 0,
                nextState.current?.[shipId].position?.y ?? 0,
                t
              ),
              z: lerp(
                previousState.current?.[shipId].position?.z ?? 0,
                nextState.current?.[shipId].position?.z ?? 0,
                t
              ),
            };

            const prevArray = [
              previousState.current?.[shipId].rotation?.x ?? 0,
              previousState.current?.[shipId].rotation?.y ?? 0,
              previousState.current?.[shipId].rotation?.z ?? 0,
              previousState.current?.[shipId].rotation?.w ?? 1,
            ];
            const nextArray = [
              nextState.current?.[shipId].rotation?.x ?? 0,
              nextState.current?.[shipId].rotation?.y ?? 0,
              nextState.current?.[shipId].rotation?.z ?? 0,
              nextState.current?.[shipId].rotation?.w ?? 1,
            ];
            Quaternion.slerpFlat(
              rotationOutput,
              0,
              prevArray,
              0,
              nextArray,
              0,
              t
            );
            const [x, y, z, w] = rotationOutput;
            ship.rotation = {x, y, z, w};
          }
        }),
      true
    );
  });
  const client = useApolloClient();
  const lastSystemId = useRef(systemId);

  React.useEffect(() => {
    if (!systemId) return;
    if (systemId !== lastSystemId.current) {
      lastSystemId.current = systemId;
      setShipIds([]);
    }
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
            previousState.current = useSystemShipsStore.getState();
            nextState.current = produce(previousState.current, draft => {
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
            });

            timeIntervals.current.unshift(Date.now() - timeStamp.current);
            timeIntervals.current = timeIntervals.current.slice(0, 20);
            // averageInterval.current = timeIntervals.current.reduce(
            //   (prev, next, i, arr) => prev + next / arr.length,
            //   0
            // );
            timeStamp.current = Date.now();
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
