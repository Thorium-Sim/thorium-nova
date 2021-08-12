import {ClientChannel} from "@geckos.io/client";
import {useCallback, useEffect, useRef, useState} from "react";
import {loadDataChannel, loadWebSocket} from "../utils/dataChannel";
import {NetResponseData} from "../context/ThoriumContext";
import uniqid from "@thorium/uniqid";
import {ClientSocket} from "../utils/clientSocket";

export function useDataConnection() {
  const [channel, setChannel] = useState<ClientChannel>(null!);
  const [socket, setSocket] = useState<ClientSocket>(null!);
  const [reconnectionState, setReconnectionState] = useState<
    "idle" | "connected" | "connecting" | "reconnecting" | "disconnected"
  >("idle");
  const requestResponses = useRef<
    Record<
      string,
      {resolve: (value: any) => void; reject: (reason?: any) => void}
    >
  >({});

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

  useEffect(() => {
    if (socket) {
      const handleNetResponse = (data: NetResponseData) => {
        if (typeof data !== "object") {
          throw new Error(`netResponse data must be an object. Got "${data}"`);
        }

        if (!("requestId" in data && "response" in data)) {
          const dataString = JSON.stringify(data, null, 2);
          throw new Error(
            `netResponse data must include a requestId and a response. Got ${dataString}`
          );
        }

        const responseCallback = requestResponses.current[data.requestId];
        if (!responseCallback) {
          throw new Error(`No response callback for ${data.requestId}`);
        }
        if (data.error) {
          return responseCallback.reject(data.error);
        }
        responseCallback.resolve(data.response);
        delete requestResponses.current[data.requestId];
      };
      socket.on("netResponse", handleNetResponse);
      return () => {
        socket.off("netResponse", handleNetResponse);
      };
    }
  }, [socket]);

  const netSend = useCallback(
    async function netSend(inputName, inputParams) {
      const TIMEOUT_MS = 3000;
      // This Promise.race means that the server has TIMEOUT_MS to respond to any netSend.
      // It results in a rejection which must be handled somehow.
      const requestId = uniqid("ns-");
      return Promise.race([
        new Promise((resolve, reject) => {
          socket.send("netSend", {inputName, params: inputParams, requestId});
          requestResponses.current[requestId] = {resolve, reject};
        }),
        new Promise((_, rej) =>
          setTimeout(() => {
            delete requestResponses.current[requestId];
            rej(`Timeout getting response for input: ${inputName}`);
          }, TIMEOUT_MS)
        ),
        // Assert `any` to make the AllInputReturns inference work correctly
      ]) as Promise<any>;
    },
    [socket]
  );
  return {channel, reconnectionState, netSend, socket};
}
