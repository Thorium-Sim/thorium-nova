import uniqid from "@thorium/uniqid";
import { useEffect, useState } from "react";
import { stableValueHash } from "./stableValueHash";
import { useLiveQuery } from "./liveQueryContext";

const requestMap = new Map<string, Set<string>>();

export function useRequestSub(
	requestParams: { path: string; params?: any },
	mockData?: any,
) {
	const id = stableValueHash([requestParams.path, requestParams.params]);
	const [hookId] = useState(uniqid());
	const { socket, reconnectionState } = useLiveQuery();
	const isConnected = reconnectionState === "connected";
	// biome-ignore lint/correctness/useExhaustiveDependencies:
	useEffect(() => {
		if (!socket || !isConnected || mockData) return;
		if (!requestMap.has(id)) {
			requestMap.set(id, new Set());
		}
		if (requestMap.get(id)?.size === 0) {
			// Subscribe to the effect
			socket.send("netRequest", { ...requestParams, id: id });
		}

		requestMap.get(id)?.add(hookId);

		return () => {
			requestMap.get(id)?.delete(hookId);
			if (!requestMap.get(id) || requestMap.get(id)?.size === 0) {
				// Unsubscribe from the effect
				socket.send("netRequestEnd", { id: id });
			}
		};
		// The request ID is a stable way to represent the missing dependencies
	}, [socket, hookId, id, isConnected]);
}
