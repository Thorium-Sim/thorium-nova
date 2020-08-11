import React from "react";
import {StoreApi} from "zustand";
import useAnimationFrame from "./useAnimationFrame";
import {TSubscriptionResponse} from "./useTSubscription";

function lerp(v0: number, v1: number, t: number) {
  return v0 * (1 - t) + v1 * t;
}

function interpolate(t: number, entity: any, gameEntity: any) {
  if (!gameEntity) return entity;
  return {
    ...gameEntity,
    // Only the position component should be interpolated.
    Position: Object.fromEntries(
      Object.entries(entity.Position).map(([key, value]) => [
        key,
        lerp(gameEntity.Position[key], value as number, t),
      ])
    ),
  };
}
const serverInterval = 1000 / 5;
export default function useLinearInterpolation(
  storeApi: StoreApi<TSubscriptionResponse<any>>,
  storeKey: string = "objects"
) {
  const previousGameState = React.useRef(storeApi.getState());
  const storedEndTime = React.useRef(previousGameState.current?.endTime);

  useAnimationFrame(() => {
    const state = storeApi.getState();
    if (state.endTime !== storedEndTime.current) {
      previousGameState.current = state;
      storedEndTime.current = state.endTime;
    }

    let t = Math.max(
      0,
      Math.min(1, Math.abs(1 - (state.endTime - Date.now()) / serverInterval))
    );
    let newData;
    if (Array.isArray(state.data[storeKey])) {
      newData = state.data[storeKey].map((entity: any) => {
        const gameEntity = previousGameState.current.gameState[storeKey]?.find(
          (s: any) => s.id === entity.id
        );
        return interpolate(t, entity, gameEntity);
      });
    } else {
      newData = interpolate(
        t,
        state.data[storeKey],
        previousGameState.current.data.gameState[storeKey]
      );
    }
    storeApi.setState({
      ...state,
      gameState: {...state.gameState, [storeKey]: newData},
    });
  });
}
