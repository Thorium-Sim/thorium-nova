import {useReducer, useEffect, useCallback, Reducer, ReducerState} from "react";

export function useLocalStorageReducer<R extends Reducer<I, any>, I>(
  reducer: R,
  defaultState: I,
  storageKey: string
) {
  const init = useCallback(() => {
    let preloadedState;
    try {
      preloadedState = JSON.parse(
        window.localStorage.getItem(storageKey) || ""
      );
      // validate preloadedState if necessary
    } catch (e) {
      // ignore
    }
    return preloadedState || defaultState;
  }, [storageKey, defaultState]);

  const hookVars = useReducer(reducer, null, init);

  useEffect(() => {
    localStorage.setItem(storageKey, JSON.stringify(hookVars[0]));
  }, [storageKey, hookVars[0]]);

  return hookVars;
}
