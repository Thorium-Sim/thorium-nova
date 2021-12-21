import {useCallback, useEffect, useState} from "react";
import {loadWebSocket} from "../utils/dataChannel";
import {ClientSocket} from "../utils/clientSocket";

export type NetResponseData =
  | string
  | number
  | Object
  | {requestId: string; response?: any; error?: string};

export function useDataConnection() {
  const [socket, setSocket] = useState<ClientSocket>(null!);
  const [reconnectionState, setReconnectionState] = useState<
    "idle" | "connected" | "connecting" | "reconnecting" | "disconnected"
  >("idle");

  const startDataConnection = useCallback(async function startDataConnection() {
    try {
      setReconnectionState(state =>
        state === "idle" ? "connecting" : "reconnecting"
      );
      const socket = await loadWebSocket();
      setSocket(new ClientSocket(socket));
      socket.addEventListener("close", () => {
        setReconnectionState("reconnecting");
      });

      socket.addEventListener("open", () => {
        setReconnectionState("connected");
      });
      setReconnectionState("connected");
    } catch (err) {
      setReconnectionState("disconnected");
    }
  }, []);

  useEffect(() => {
    startDataConnection();
  }, [startDataConnection]);

  return {reconnectionState, socket};
}
