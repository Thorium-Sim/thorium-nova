import {useCallback, useEffect, useState} from "react";
import {loadWebSocket} from "../utils/dataChannel";
import {ClientSocket} from "../utils/clientSocket";
import {AuthData} from "@thorium/types";
import {getTabId, getTabIdSync} from "@thorium/tab-id";
import ReconnectingWebSocket from "reconnecting-websocket";

export type NetResponseData =
  | string
  | number
  | Object
  | {requestId: string; response?: any; error?: string};

const connectClient = (socket: ReconnectingWebSocket, clientId: string) => {
  const authData: AuthData = {
    clientId,
    type: "clientConnect",
  };
  socket.send(JSON.stringify(authData));
};
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

      const clientId = await getTabId();
      const socket = await loadWebSocket();
      connectClient(socket, clientId);

      setSocket(new ClientSocket(socket));
      socket.addEventListener("close", () => {
        setReconnectionState("reconnecting");
      });

      socket.addEventListener("open", () => {
        const clientId = getTabIdSync();
        if (!clientId) {
          setReconnectionState("disconnected");
          return;
        }
        connectClient(socket, clientId);
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
