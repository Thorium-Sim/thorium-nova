import { useReducer, useEffect, useCallback, type Reducer } from "react";

export function useSessionStorageReducer<R extends Reducer<I, any>, I>(
	reducer: R,
	defaultState: I,
	storageKey: string,
) {
	const init = useCallback(() => {
		let preloadedState: any;
		try {
			preloadedState = JSON.parse(
				window.sessionStorage.getItem(storageKey) || "",
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
		sessionStorage.setItem(storageKey, JSON.stringify(hookyHook));
	}, [storageKey, hookyHook]);

	return hookVars;
}

export function useSessionStorage<T>(storageKey: string, defaultValue: T) {
	return useSessionStorageReducer(
		(state: T, action: T) => action,
		defaultValue,
		storageKey,
	);
}
