import {createContext, ReactNode, useContext, useMemo} from "react";
import * as React from "react";
import {useDataConnection} from "../hooks/useDataConnection";
import {FaSpinner} from "react-icons/fa";
import {SnapshotInterpolation} from "@geckos.io/snapshot-interpolation";
import {ClientSocket} from "../utils/clientSocket";
import Button from "@thorium/ui/Button";
import {ThoriumAccountContextProvider} from "./ThoriumAccountContext";
import {SI} from "../utils/clientSocket";

const ThoriumContext = createContext<IThoriumContext | null>(null);

interface IThoriumContext {
  SI: SnapshotInterpolation;
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

export function ThoriumProvider({children}: {children: ReactNode}) {
  const {socket, reconnectionState} = useDataConnection();
  const value: IThoriumContext = useMemo(() => {
    return {
      socket,
      SI,
    };
  }, [socket]);

  return (
    <ThoriumContext.Provider value={value}>
      <ThoriumAccountContextProvider>{children}</ThoriumAccountContextProvider>
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
