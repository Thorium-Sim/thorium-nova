import {ClientChannel} from "@geckos.io/client";
import {createContext, ReactNode, useContext, useEffect, useMemo} from "react";
import type {
  AllInputNames,
  AllInputParams,
  AllInputReturns,
} from "@thorium/inputs";
import {useDataConnection} from "../hooks/useDataConnection";
import {FaSpinner} from "react-icons/fa";
import {SnapshotInterpolation, Types} from "@geckos.io/snapshot-interpolation";
import {decode} from "@msgpack/msgpack";
import {ClientSocket} from "../utils/clientSocket";
import Button from "@thorium/ui/Button";
const serverFPS = 3;

const ThoriumContext = createContext<IThoriumContext | null>(null);

interface IThoriumContext {
  SI: SnapshotInterpolation;
  channel: ClientChannel;
  socket: ClientSocket;
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

const SI = new SnapshotInterpolation(serverFPS);
export function ThoriumProvider({children}: {children: ReactNode}) {
  const {channel, socket, reconnectionState} = useDataConnection();

  useEffect(() => {
    channel?.onRaw(snapshot => {
      if (snapshot instanceof ArrayBuffer) {
        const decoded = decode(snapshot) as Types.Snapshot;
        SI.snapshot.add(decoded);
      }
    });
  }, [channel]);
  const value: IThoriumContext = useMemo(() => {
    return {
      channel,
      socket,
      SI,
    };
  }, [channel, socket]);

  return (
    <ThoriumContext.Provider value={value}>
      {children}
      {reconnectionState === "reconnecting" && <Reconnecting />}
      {reconnectionState === "disconnected" && <Disconnected />}
    </ThoriumContext.Provider>
  );
}
export function useThorium() {
  const ctx = useContext(ThoriumContext);
  if (!ctx) throw new Error("Thorium Context has not been initialized.");
  return ctx;
}
