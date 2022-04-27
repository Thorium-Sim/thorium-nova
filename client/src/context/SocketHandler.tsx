import {getTabIdSync} from "@thorium/tab-id";
import {useEffect} from "react";
import {useErrorHandler} from "react-error-boundary";
import {useQueryClient} from "react-query";
import {NetResponseData} from "../hooks/useDataConnection";
import {DataCardNames, SubscriptionNames} from "../utils/cardData";
import {FaSpinner} from "react-icons/fa";
import Button from "@thorium/ui/Button";
import {ClientSocket} from "../utils/clientSocket";

type CardData =
  | string
  | number
  | Object
  | {card: DataCardNames; data: Record<SubscriptionNames, any>};

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
      const handleCardData = (data: CardData) => {
        if (typeof data !== "object") {
          throw new Error(`cardData data must be an object. Got "${data}"`);
        }
        if (!("card" in data && "data" in data)) {
          const dataString = JSON.stringify(data, null, 2);
          throw new Error(
            `cardData data must include a card name and a data object. Got ${dataString}`
          );
        }
        const clientId = getTabIdSync();
        const queryKey = [clientId, "cardData", data.card];
        queryClient.setQueryData(queryKey, oldData =>
          typeof oldData === "object" ? {...oldData, ...data.data} : data.data
        );
      };

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
          queryClient.invalidateQueries(queryKey);
        } catch (err) {
          console.error(err);
          handleError(err);
        }
      }

      function handleReady() {
        queryClient.refetchQueries();
      }
      socket.on("cardData", handleCardData);
      socket.on("netRequestData", handleNetRequestData);
      socket.on("ready", handleReady);
      return () => {
        socket.off("cardData", handleCardData);
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
