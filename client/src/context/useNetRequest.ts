import {
  MutableRefObject,
  useCallback,
  useEffect,
  useReducer,
  useRef,
  useState,
} from "react";
import {
  AllRequestNames,
  AllRequestParams,
  AllRequestReturns,
} from "server/src/netRequests";
import {proxy, useSnapshot} from "valtio";
import {NetResponseData} from "../hooks/useDataConnection";
import {stableValueHash} from "../utils/stableValueHash";
import {useThorium} from "./ThoriumContext";
import {useErrorHandler} from "react-error-boundary";
import {getTabId} from "@thorium/tab-id";
import uniqid from "@thorium/uniqid";
const netRequestProxy = proxy<Partial<{[requestId: string]: any}>>({});
const mountedNetRequests: Map<string, Set<string>> = new Map();
const netRequestPromises: {[requestId: string]: (value: unknown) => void} = {};
const netRequestCallbacks: Map<
  string,
  MutableRefObject<((result: any) => void) | undefined>
> = new Map();

export function NetRequestData() {
  useNetRequestData();
  return null;
}
function useNetRequestData() {
  const {socket} = useThorium();
  const handleError = useErrorHandler();

  if (!socket) throw new Promise(() => {});
  useEffect(() => {
    function handleNetRequestData(data: NetResponseData) {
      try {
        if (typeof data !== "object") {
          throw new Error(`netResponse data must be an object. Got "${data}"`);
        }
        if ("error" in data) {
          throw new Error(data.error);
        }
        if (!("requestId" in data && "response" in data)) {
          const dataString = JSON.stringify(data, null, 2);
          throw new Error(
            `netResponse data must include a requestId and a response. Got ${dataString}`
          );
        }
        netRequestProxy[data.requestId] = data.response;
        netRequestPromises[data.requestId]?.(null);
        netRequestCallbacks.get(data.requestId)?.current?.(data.response);
      } catch (err) {
        handleError(err);
      }
    }
    socket.on("netRequestData", handleNetRequestData);
    return () => {
      socket.off("netRequestData", handleNetRequestData);
    };
  }, [socket, handleError]);
}

type UnwrapPromise<T> = T extends Promise<infer U> ? U : T;

export async function netRequest<
  T extends AllRequestNames,
  R extends AllRequestReturns[T]
>(requestName: T, params?: AllRequestParams[T]): Promise<UnwrapPromise<R>> {
  const requestId = stableValueHash({requestName, params});
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
  netRequestProxy[requestId] = result;

  return result;
}

export function useNetRequest<
  T extends AllRequestNames,
  R extends AllRequestReturns[T]
>(
  requestName: T,
  params?: AllRequestParams[T],
  callback?: (result: UnwrapPromise<R>) => void
): UnwrapPromise<R> {
  const requestId = stableValueHash({requestName, params});
  const data = useSnapshot(netRequestProxy);
  const {socket} = useThorium();
  const [ready, resetReady] = useReducer(() => ({}), {});
  const [hookId] = useState(() => uniqid());
  if (!socket) throw new Promise(() => {});

  const setUpRequest = useCallback(
    hookId => {
      let request = mountedNetRequests.get(requestId);
      if (!request) {
        request = new Set();
        mountedNetRequests.set(requestId, request);
      }

      if (request.size === 0) {
        socket.send("netRequest", {requestName, params, requestId});
      }
      request.add(hookId);
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps -- Params are properly tracked via the requestId
    [requestId, requestName, socket]
  );

  const takeDownRequest = useCallback(
    hookId => {
      let request = mountedNetRequests.get(requestId);
      request?.delete(hookId);
      if (!request || request?.size === 0) {
        socket.send("netRequestEnd", {requestId});
        delete netRequestPromises[requestId];
      }
    },
    [requestId, socket]
  );

  useEffect(() => {
    const handleReady = () => {
      resetReady();
      delete data[requestId];
    };
    socket.on("ready", handleReady);
    return () => {
      socket.off("ready", handleReady);
    };
  }, [socket, requestId, data]);

  useEffect(() => {
    setUpRequest(hookId);
    return () => {
      takeDownRequest(hookId);
    };
  }, [setUpRequest, takeDownRequest, ready, hookId, requestId]);

  const callbackRef = useRef(callback);
  useEffect(() => {
    callbackRef.current = callback;
  }, [callback]);

  useEffect(() => {
    if (callbackRef.current) {
      netRequestCallbacks.set(requestId, callbackRef);
    }
    return () => {
      netRequestCallbacks.delete(requestId);
    };
  }, [requestId]);

  if (!data[requestId] && data[requestId] !== null) {
    setUpRequest(hookId);
    throw new Promise(res => {
      netRequestPromises[requestId] = res;
    });
  }

  return data[requestId];
}
