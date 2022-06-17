import {createContext, ReactNode, useContext, useMemo} from "react";
import {useDataConnection} from "../hooks/useDataConnection";
import {ClientSocket} from "../utils/clientSocket";
import {ThoriumAccountContextProvider} from "./ThoriumAccountContext";
import {SI} from "../utils/clientSocket";
import {QueryClient, QueryClientProvider} from "react-query";
import {ReactQueryDevtools} from "react-query/devtools";
import {SocketHandler} from "./SocketHandler";
import {InterpolatedSnapshot} from "@geckos.io/snapshot-interpolation/lib/types";

export const ThoriumContext = createContext<IThoriumContext | null>(null);

interface IThoriumContext {
  interpolate: (entityId: number) => null | {x: number; y: number; z: number};
  socket: ClientSocket;
  reconnectionState: ReturnType<typeof useDataConnection>["reconnectionState"];
}

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      suspense: true,
    },
  },
});

type EntityValues = {
  x: number;
  y: number;
  z: number;
};

let interpolationCache: Record<string, EntityValues> = {};

export function processInterpolation(
  snapshot: InterpolatedSnapshot | undefined
) {
  if (!snapshot) return {};
  return snapshot.state.forEach(entity => {
    interpolationCache[entity.id] = {
      x: entity.x,
      y: entity.y,
      z: entity.z,
    } as EntityValues;
  });
}

function updateInterpolation() {
  processInterpolation(SI.calcInterpolation("x y z"));
  requestAnimationFrame(updateInterpolation);
}

updateInterpolation();

export function ThoriumProvider({children}: {children: ReactNode}) {
  const {socket, reconnectionState} = useDataConnection();

  const value: IThoriumContext = useMemo(() => {
    return {
      interpolate: (entityId: number) => {
        let state = interpolationCache?.[entityId.toString()];

        if (!state) return null;
        return state;
      },
      socket,
      reconnectionState,
    };
  }, [socket, reconnectionState]);

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
