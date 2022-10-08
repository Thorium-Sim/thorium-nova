import uniqid from "@thorium/uniqid";
import {useEffect, useState} from "react";
import {stableValueHash} from "../utils/stableValueHash";
import {useThorium} from "./ThoriumContext";

const requestMap = new Map<string, Set<string>>();

export function useRequestSub(requestParams: {
  requestName: string;
  params?: any;
}) {
  const requestId = stableValueHash(requestParams);
  const [hookId] = useState(uniqid());
  const {socket, reconnectionState} = useThorium();
  const isConnected = reconnectionState === "connected";
  useEffect(() => {
    if (!socket || !isConnected) return;
    if (!requestMap.has(requestId)) {
      requestMap.set(requestId, new Set());
    }
    if (requestMap.get(requestId)?.size === 0) {
      // Subscribe to the effect
      socket.send("netRequest", {...requestParams, requestId});
    }

    requestMap.get(requestId)?.add(hookId);

    return () => {
      requestMap.get(requestId)?.delete(hookId);
      if (!requestMap.get(requestId) || requestMap.get(requestId)?.size === 0) {
        // Unsubscribe from the effect
        socket.send("netRequestEnd", {requestId});
      }
    };
    // The request ID is a stable way to represent the missing dependencies
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [socket, hookId, requestId, isConnected]);
}
