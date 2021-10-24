import {ClientChannel} from "@geckos.io/client";
import {useCallback, useEffect, useState} from "react";
import {loadDataChannel, loadWebSocket} from "../utils/dataChannel";
import {ClientSocket} from "../utils/clientSocket";

export type NetResponseData =
  | string
  | number
  | Object
  | {requestId: string; response?: any; error?: string};

export function useDataConnection() {
  const [channel, setChannel] = useState<ClientChannel>(null!);
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
        loadChannel();
        setReconnectionState("connected");
      });
      loadChannel();
      setReconnectionState("connected");
      function loadChannel() {
        loadDataChannel()
          .then(channel => {
            setChannel(channel);
          })
          .catch(err => {
            setChannel(socket as any);
          });
      }
    } catch (err) {
      setReconnectionState("disconnected");
    }
  }, []);

  useEffect(() => {
    startDataConnection();
  }, [startDataConnection]);

  return {channel, reconnectionState, socket};
}
