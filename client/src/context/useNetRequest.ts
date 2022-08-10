import {createContext, useContext, useEffect, useRef} from "react";
import {
  AllRequestNames,
  AllRequestParams,
  AllRequestReturns,
} from "server/src/netRequests";
import {getTabId, getTabIdSync} from "@thorium/tab-id";
import {useQuery, QueryFunctionContext} from "@tanstack/react-query";
import {useRequestSub} from "./useRequestSub";

type UnwrapPromise<T> = T extends Promise<infer U> ? U : T;

export const MockNetRequestContext = createContext<any>(null!);

export async function netRequest<
  T extends AllRequestNames,
  R extends AllRequestReturns[T]
>(
  requestName: T,
  params?: AllRequestParams[T],
  options: {signal?: AbortSignal} = {}
): Promise<R> {
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
    signal: options.signal,
  }).then(res => res.json());
  if (result?.error) {
    throw new Error(result.error);
  }

  return result as R;
}

async function queryFn<T extends AllRequestNames>({
  queryKey,
}: QueryFunctionContext) {
  const [_, __, requestName, params] = queryKey as [
    string,
    "netRequest",
    T,
    AllRequestParams[T]
  ];
  const data = await netRequest(requestName, params);
  return (data as any) || null;
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

  const netRequestQuery = useQuery<UnwrapPromise<R>>(
    [clientId, "netRequest", requestName, params],
    queryFn,
    {
      refetchOnMount: false,
      refetchOnReconnect: false,
      refetchOnWindowFocus: false,
      networkMode: "always",
      staleTime: Infinity,
      cacheTime: Infinity,
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
