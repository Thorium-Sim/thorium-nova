import {createContext, useContext, useEffect, useRef} from "react";
import {
  AllRequestNames,
  AllRequestParams,
  AllRequestReturns,
} from "server/src/netRequests";
import {getTabId, getTabIdSync} from "@thorium/tab-id";
import {useQuery} from "react-query";
import {useThorium} from "./ThoriumContext";
import {stableValueHash} from "../utils/stableValueHash";
import {useRequestSub} from "./useRequestSub";

type UnwrapPromise<T> = T extends Promise<infer U> ? U : T;

export const MockNetRequestContext = createContext<any>(null!);

export async function netRequest<
  T extends AllRequestNames,
  R extends AllRequestReturns[T]
>(requestName: T, params?: AllRequestParams[T]): Promise<R> {
  const clientId = await getTabId();
  const body = {
    request: requestName,
    ...(params as any),
  };
  const result = await fetch(`/netRequest`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      authorization: `Bearer ${clientId}`,
    },
    body: JSON.stringify(body),
  }).then(res => res.json());
  if (result.error) {
    throw new Error(result.error);
  }

  return result as R;
}

export function useNetRequest<
  T extends AllRequestNames,
  R extends AllRequestReturns[T]
>(
  requestName: T,
  params?: AllRequestParams[T],
  callback?: (result: UnwrapPromise<R>) => void
): UnwrapPromise<R> {
  const clientId = getTabIdSync();
  const {socket} = useThorium();
  const requestId = stableValueHash({requestName, params});

  const netRequestQuery = useQuery<UnwrapPromise<R>>(
    [clientId, "netRequest", requestName, params],
    async () => {
      const data = await netRequest(requestName, params);
      return (data as any) || null;
    }
  );

  useRequestSub({requestName, params});

  const mockData = useContext(MockNetRequestContext);

  const callbackRef = useRef(callback);
  useEffect(() => {
    callbackRef.current = callback;
  }, [callback]);

  useEffect(() => {
    if (!netRequestQuery.data) return;
    callbackRef.current?.(netRequestQuery.data);
  }, [netRequestQuery.data]);

  if (mockData) return mockData[requestName];

  return netRequestQuery.data as any;
}
