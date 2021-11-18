import {useReducer, useEffect, useCallback, Reducer} from "react";

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

  const hookyHook = hookVars[0];
  useEffect(() => {
    localStorage.setItem(storageKey, JSON.stringify(hookyHook));
  }, [storageKey, hookyHook]);

  return hookVars;
}

export function useLocalStorage<T>(storageKey: string, defaultValue: T) {
  return useLocalStorageReducer(
    (state, action) => action,
    defaultValue,
    storageKey
  );
}
