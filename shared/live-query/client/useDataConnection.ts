import {useCallback, useEffect, useRef, useState} from "react";
import {loadWebSocket} from "./dataChannel";
import {ClientSocket} from "./clientSocket";
import ReconnectingWebSocket from "reconnecting-websocket";
import {SERVER_FPS} from "../constants";
import {RequestContext} from "./liveQueryContext";
export type NetResponseData =
  | {id: string; error: any}
  | {id: string; data: any};

const connectClient = async <TContext extends RequestContext>(
  socket: ReconnectingWebSocket,
  context: TContext
) => {
  socket.send(JSON.stringify({type: "clientConnect", ...context}));
};

const isTestEnv = process.env.NODE_ENV === "test";

export function useDataConnection<TContext extends RequestContext>(
  getRequestContext: () => TContext | Promise<TContext>
) {
  const [socket, setSocket] = useState<ClientSocket>(null!);
  const socketSet = useRef(false);
  const [reconnectionState, setReconnectionState] = useState<
    "idle" | "connected" | "connecting" | "reconnecting" | "disconnected"
  >("idle");

  const startDataConnection = useCallback(
    async function startDataConnection() {
      if (socketSet.current) return;
      try {
        const context = await getRequestContext();
        setReconnectionState(state =>
          state === "idle" ? "connecting" : "reconnecting"
        );
        const socket = await loadWebSocket();
        await connectClient(socket, context);

        // TODO: Figure out some way to get the network FPS from the server when we connect
        setSocket(new ClientSocket(socket, SERVER_FPS));
        socket.addEventListener("close", () => {
          setReconnectionState("reconnecting");
        });

        socket.addEventListener("open", () => {
          connectClient(socket, context);
          setReconnectionState("connected");
        });
        setReconnectionState("connected");
        socketSet.current = true;
      } catch (err) {
        setReconnectionState("disconnected");
      }
    },
    [getRequestContext]
  );

  useEffect(() => {
    if (isTestEnv) return;
    startDataConnection();
    return () => {
      socket?.close();
      socketSet.current = false;
      setSocket(null!);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [startDataConnection]);

  return {reconnectionState, socket};
}
