import {useCallback, useEffect, useReducer} from "react";
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
const netRequestProxy = proxy<Partial<{[requestId: string]: any}>>({});
const netRequestPromises: {[requestId: string]: (value: unknown) => void} = {};

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

export function useNetRequest<
  T extends AllRequestNames,
  R extends AllRequestReturns[T]
>(requestName: T, params?: AllRequestParams[T]): UnwrapPromise<R> {
  const requestId = stableValueHash({requestName, params});
  const data = useSnapshot(netRequestProxy);
  const {socket} = useThorium();
  const [ready, resetReady] = useReducer(() => ({}), {});
  if (!socket) throw new Promise(() => {});

  const setUpRequest = useCallback(() => {
    if (!netRequestPromises[requestId]) {
      socket.send("netRequest", {requestName, params, requestId});
    }
  }, [params, requestId, requestName, socket]);

  const takeDownRequest = useCallback(() => {
    socket.send("netRequestEnd", {requestId});
    delete netRequestPromises[requestId];
  }, [requestId, socket]);

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
    setUpRequest();
    return () => takeDownRequest();
  }, [setUpRequest, takeDownRequest, ready]);

  if (!data[requestId] && data[requestId] !== null) {
    setUpRequest();
    throw new Promise(res => {
      netRequestPromises[requestId] = res;
    });
  }

  return data[requestId];
}
