import {createContext, ReactNode, useContext, useMemo} from "react";
import {useDataConnection} from "../hooks/useDataConnection";
import {SnapshotInterpolation} from "@geckos.io/snapshot-interpolation";
import {ClientSocket} from "../utils/clientSocket";
import {ThoriumAccountContextProvider} from "./ThoriumAccountContext";
import {SI} from "../utils/clientSocket";
import {QueryClient, QueryClientProvider} from "react-query";
import {ReactQueryDevtools} from "react-query/devtools";
import {SocketHandler} from "./SocketHandler";
export const ThoriumContext = createContext<IThoriumContext | null>(null);

interface IThoriumContext {
  SI: SnapshotInterpolation;
  socket: ClientSocket;
}

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      suspense: true,
    },
  },
});

export function ThoriumProvider({children}: {children: ReactNode}) {
  const {socket, reconnectionState} = useDataConnection();

  const value: IThoriumContext = useMemo(() => {
    return {
      SI,
      socket,
    };
  }, [socket]);

  return (
    <ThoriumContext.Provider value={value}>
      <QueryClientProvider client={queryClient}>
        <ThoriumAccountContextProvider>
          {children}
        </ThoriumAccountContextProvider>
        <SocketHandler socket={socket} reconnectionState={reconnectionState} />
        <ReactQueryDevtools position="bottom-right" />
      </QueryClientProvider>
    </ThoriumContext.Provider>
  );
}
export function useThorium() {
  const ctx = useContext(ThoriumContext);
  if (!ctx) throw new Error("Thorium Context has not been initialized.");
  return ctx;
}
