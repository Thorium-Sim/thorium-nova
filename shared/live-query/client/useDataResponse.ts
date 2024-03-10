import { useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useLiveQuery } from "./liveQueryContext";
import { getQueryKey } from "./getQueryKey";
import { getArrayQueryKey } from "./getArrayQueryKey";
import type { NetResponseData } from "./useDataConnection";

const dataCallbacks: Map<string, Set<(data: any) => void>> = new Map();

export function addDataCallback<TData>(
	queryKey: string,
	callback: (data: TData) => void,
) {
	if (callback) {
		let callbackSet = dataCallbacks.get(queryKey);
		if (!callbackSet) {
			callbackSet = new Set<(data: any) => void>();
			dataCallbacks.set(queryKey, callbackSet);
		}
		callbackSet.add(callback);

		return () => callbackSet?.delete(callback);
	}

	return () => {};
}

export function useDataResponse() {
	const queryClient = useQueryClient();
	const { socket } = useLiveQuery();
	useEffect(() => {
		if (socket) {
			function handleNetRequestData(data: NetResponseData) {
				if (typeof data !== "object") {
					throw new Error(`netResponse data must be an object. Got "${data}"`);
				}
				if (!("id" in data && ("data" in data || "error" in data))) {
					const dataString = JSON.stringify(data, null, 2);
					throw new Error(
						`netResponse data must include an id and a response. Got ${dataString}`,
					);
				}

				const [path, params] = JSON.parse(data.id);
				const queryKey = getArrayQueryKey(getQueryKey(path, params));

				if ("error" in data) {
					const query = queryClient
						.getQueryCache()
						.build(queryClient, { queryKey });
					const state = queryClient.getQueryState(queryKey);
					if (state) {
						query.setState({
							...state,
							error: new Error((data as any).error),
							errorUpdateCount: state.errorUpdateCount + 1,
							errorUpdatedAt: Date.now(),
						});
					}
					return;
				}

				queryClient.setQueryData(queryKey, data.data);

				dataCallbacks.get(JSON.stringify(queryKey))?.forEach((callback) => {
					callback(data.data);
				});
			}

			function handleReady() {
				queryClient.refetchQueries(undefined, { cancelRefetch: false });
			}
			socket.on("netRequestData", handleNetRequestData);
			socket.on("connected", handleReady);
			return () => {
				socket.off("netRequestData", handleNetRequestData);
				socket.off("connected", handleReady);
			};
		}
	}, [socket, queryClient]);
}
