import { useReducer, useEffect, useCallback, type Reducer } from "react";

export function useLocalStorageReducer<R extends Reducer<I, A>, I, A>(
	reducer: R,
	defaultState: I,
	storageKey: string,
) {
	const init = useCallback(() => {
		let preloadedState: any;
		try {
			preloadedState = JSON.parse(window.localStorage.getItem(storageKey) || "");
			// validate preloadedState if necessary
		} catch {
			// ignore
		}
		if (typeof preloadedState === "string") return preloadedState;
		if (typeof defaultState === "string") return defaultState;
		return { ...defaultState, ...preloadedState };
	}, [storageKey, defaultState]);

	const hookVars = useReducer(reducer, null, init);

	const hookyHook = hookVars[0];
	useEffect(() => {
		localStorage.setItem(storageKey, JSON.stringify(hookyHook));
	}, [storageKey, hookyHook]);

	return hookVars;
}

export function useLocalStorage<T>(storageKey: string, defaultValue: T) {
	return useLocalStorageReducer((state: T, action: any) => action, defaultValue, storageKey);
}
