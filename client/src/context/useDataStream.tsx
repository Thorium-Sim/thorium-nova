import uniqid from "@thorium/uniqid";
import {useEffect, useState} from "react";
import {DataStreamParams} from "../utils/cardData";
import {stableValueHash} from "../utils/stableValueHash";
import {useCardContext} from "./CardContext";
import {useThorium} from "./ThoriumContext";

const requestMap = new Map<string, Set<string>>();

export function useDataStream<T extends keyof DataStreamParams>(
  params?: DataStreamParams[T]
) {
  const {socket, reconnectionState} = useThorium();
  const {cardName} = useCardContext();

  const requestId = stableValueHash({cardName, params});
  const [hookId] = useState(uniqid());
  const isConnected = reconnectionState === "connected";

  useEffect(() => {
    if (!socket || !isConnected) return;
    if (!requestMap.has(requestId)) {
      requestMap.set(requestId, new Set());
    }
    if (requestMap.get(requestId)?.size === 0) {
      // Subscribe to the effect
      socket.send("dataStream", {cardName, params, requestId});
    }

    requestMap.get(requestId)?.add(hookId);

    return () => {
      requestMap.get(requestId)?.delete(hookId);
      if (!requestMap.get(requestId) || requestMap.get(requestId)?.size === 0) {
        // Unsubscribe from the effect
        socket.send("dataStreamEnd", {requestId});
      }
    };
    // The request ID is a stable way to represent the missing dependencies
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [socket, hookId, requestId, isConnected]);
}
