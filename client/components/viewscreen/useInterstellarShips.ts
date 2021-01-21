import React, {useRef} from "react";
import {
  UniverseInterstellarShipsHotDocument,
  UniverseInterstellarShipsHotSubscription,
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
  UniverseInterstellarShipsHotSubscription["universeInterstellarShipsHot"][0]
>;
export const useInterstellarShipsStore = create<ShipMap>(() => ({}));
let rotationOutput: [number, number, number, number] = [0, 0, 0, 1];

export const useInterstellarShips = singletonHook(
  [],
  function useInterstellarShipsHook() {
    const [shipIds, setShipIds] = React.useState<string[]>([]);
    const previousState = useRef<ShipMap>({});
    const nextState = useRef<ShipMap>({});
    const timeStamp = useRef(Date.now());
    const timeIntervals = useRef([1]);
    const averageInterval = useRef(1000 / 30);
    useAnimationFrame(() => {
      const t = (Date.now() - timeStamp.current) / averageInterval.current;
      useInterstellarShipsStore.setState(
        store =>
          produce(store, draft => {
            for (let shipId in draft) {
              const ship = draft[shipId];
              if (!ship) continue;

              ship.position = {
                x: lerp(
                  previousState.current?.[shipId]?.position?.x ?? 0,
                  nextState.current?.[shipId]?.position?.x ?? 0,
                  t
                ),
                y: lerp(
                  previousState.current?.[shipId]?.position?.y ?? 0,
                  nextState.current?.[shipId]?.position?.y ?? 0,
                  t
                ),
                z: lerp(
                  previousState.current?.[shipId]?.position?.z ?? 0,
                  nextState.current?.[shipId]?.position?.z ?? 0,
                  t
                ),
              };

              const prevArray = [
                previousState.current?.[shipId]?.rotation?.x ?? 0,
                previousState.current?.[shipId]?.rotation?.y ?? 0,
                previousState.current?.[shipId]?.rotation?.z ?? 0,
                previousState.current?.[shipId]?.rotation?.w ?? 1,
              ];
              const nextArray = [
                nextState.current?.[shipId]?.rotation?.x ?? 0,
                nextState.current?.[shipId]?.rotation?.y ?? 0,
                nextState.current?.[shipId]?.rotation?.z ?? 0,
                nextState.current?.[shipId]?.rotation?.w ?? 1,
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

    React.useEffect(() => {
      if (window.location.protocol === "https:") {
        //|| window.location.host === "localhost") {
        // TODO: Implement Geckos
      } else {
        const unsub = client
          .subscribe({
            query: UniverseInterstellarShipsHotDocument,
            variables: {
              shipId: null,
            },
          })
          .subscribe({
            next({data}: {data?: UniverseInterstellarShipsHotSubscription}) {
              if (!data) return;
              setShipIds(ids => {
                if (data.universeInterstellarShipsHot.length !== ids.length) {
                  return data.universeInterstellarShipsHot.map(s => s.id);
                }
                return ids;
              });
              const shipState = produce(
                {
                  next: useInterstellarShipsStore.getState(),
                  previous: useInterstellarShipsStore.getState(),
                },
                draft => {
                  let shipList: string[] = [];
                  data.universeInterstellarShipsHot.forEach(ship => {
                    if (!draft.previous[ship.id])
                      draft.previous[ship.id] = ship;
                    draft.next[ship.id] = ship;
                    shipList.push(ship.id);
                  });
                  Object.keys(draft.previous).forEach(shipId => {
                    if (!shipList.includes(shipId)) {
                      // Delete it from both
                      delete draft.previous[shipId];
                      delete draft.next[shipId];
                    }
                  });
                }
              );
              useInterstellarShipsStore.setState(shipState.previous);
              previousState.current = shipState.previous;
              nextState.current = shipState.next;
              timeIntervals.current.unshift(Date.now() - timeStamp.current);
              timeIntervals.current = timeIntervals.current.slice(0, 20);
              averageInterval.current = timeIntervals.current.reduce(
                (prev, next, i, arr) => prev + next / arr.length,
                0
              );
              timeStamp.current = Date.now();
            },
            error(err) {
              console.error("Ship Update Error", err);
            },
          });
        return () => unsub.unsubscribe();
      }
    }, [setShipIds, client]);
    return shipIds;
  }
);
