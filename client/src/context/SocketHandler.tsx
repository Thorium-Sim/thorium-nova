import {getTabIdSync} from "@thorium/tab-id";
import {useEffect, useState} from "react";
import {useErrorHandler} from "react-error-boundary";
import {useQueryClient} from "@tanstack/react-query";
import {NetResponseData} from "../hooks/useDataConnection";
import {FaSpinner} from "react-icons/fa";
import Button from "@thorium/ui/Button";
import {ClientSocket} from "../utils/clientSocket";
import {netRequest} from "./useNetRequest";

type CardData = string | number | Object;

export function SocketHandler({
  socket,
  reconnectionState,
}: {
  socket: ClientSocket;
  reconnectionState:
    | "idle"
    | "connected"
    | "connecting"
    | "reconnecting"
    | "disconnected";
}) {
  const queryClient = useQueryClient();
  const handleError = useErrorHandler();

  useEffect(() => {
    if (socket) {
      function handleNetRequestData(data: NetResponseData) {
        try {
          if (typeof data !== "object") {
            throw new Error(
              `netResponse data must be an object. Got "${data}"`
            );
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

          const clientId = getTabIdSync();
          const requestData = JSON.parse(data.requestId) as {
            requestName: string;
            params: any;
          };
          const queryKey = [
            clientId,
            "netRequest",
            requestData.requestName,
            requestData.params,
          ];

          queryClient.setQueryData(queryKey, data.response);
          // queryClient.invalidateQueries(queryKey);
        } catch (err) {
          console.error(err);
          handleError(err);
        }
      }

      function handleReady() {
        queryClient.refetchQueries(undefined, {cancelRefetch: false});
      }
      socket.on("netRequestData", handleNetRequestData);
      socket.on("ready", handleReady);
      return () => {
        socket.off("netRequestData", handleNetRequestData);
        socket.off("ready", handleReady);
      };
    }
  }, [socket, handleError, queryClient]);

  if (reconnectionState === "reconnecting") {
    return <Reconnecting />;
  }
  if (reconnectionState === "disconnected") {
    return <Disconnected />;
  }
  return null;
}

const Reconnecting = () => {
  const [timeoutPassed, setTimeoutPassed] = useState(false);

  useEffect(() => {
    const timeout = setTimeout(() => {
      setTimeoutPassed(true);
    }, 500);
    return () => {
      clearTimeout(timeout);
    };
  }, []);

  if (!timeoutPassed) return null;

  return (
    <div className="fixed inset-0 z-30 bg-black bg-opacity-70 flex flex-col items-center justify-center space-y-8">
      <h2 className="text-6xl font-bold text-error">
        Reconnecting to Server...
      </h2>
      <FaSpinner className="text-white text-6xl animate-spin-step" />
      <Button
        className="btn btn-primary btn-lg"
        onClick={() => {
          window.location.reload();
        }}
      >
        Reconnect Now
      </Button>
    </div>
  );
};
const Disconnected = () => {
  return (
    <div className="fixed inset-0 z-30 bg-black bg-opacity-70 flex flex-col items-center justify-center">
      <h2 className="text-6xl font-bold drop-shadow-md filter text-error">
        Disconnected from Server
      </h2>
      <Button
        className="btn btn-primary btn-lg mt-16"
        onClick={() => {
          window.location.reload();
        }}
      >
        Reconnect
      </Button>
    </div>
  );
};
