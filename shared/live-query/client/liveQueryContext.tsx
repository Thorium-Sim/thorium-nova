import React, {
  createContext,
  ReactNode,
  Suspense,
  useContext,
  useMemo,
} from "react";
import {useDataConnection} from "./useDataConnection";
import {ClientSocket} from "./clientSocket";
import {QueryClient, QueryClientProvider} from "@tanstack/react-query";
import {ReactQueryDevtools} from "@tanstack/react-query-devtools";
import {InterpolatedSnapshot} from "@thorium/snapshot-interpolation/src/types";
import useAnimationFrame from "./useAnimationFrame";
import {useDataResponse} from "./useDataResponse";
import {ErrorBoundary} from "react-error-boundary";

export const LiveQueryContext = createContext<ILiveQueryContext | null>(null);
export type RequestContext = Record<any, any> & {id: string};
interface ILiveQueryContext {
  interpolate: (entityId: number) => null | EntityValues;
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
  s: 1 | 0;
  f: number;
  r: {x: number; y: number; z: number; w: number};
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
      r: entity.r,
    } as EntityValues;
  });
}

const isTestEnv = process.env.NODE_ENV === "test";

function DataResponse() {
  useDataResponse();
  return null;
}
export function LiveQueryProvider({
  children,
  getRequestContext,
}: {
  children: ReactNode;
  getRequestContext: () => RequestContext | Promise<RequestContext>;
}) {
  const {socket, reconnectionState} = useDataConnection(getRequestContext);

  useAnimationFrame(
    () => processInterpolation(socket?.SI.calcInterpolation("x y z r(quat)")),
    isTestEnv ? false : true
  );
  const value: ILiveQueryContext = useMemo(() => {
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
    <LiveQueryContext.Provider value={value}>
      <QueryClientProvider client={queryClient}>
        <ErrorBoundary fallback={<>Error Loading</>}>
          <Suspense>{children}</Suspense>
        </ErrorBoundary>
        {!isTestEnv ? <DataResponse /> : null}
        <ReactQueryDevtools position="bottom-right" />
      </QueryClientProvider>
    </LiveQueryContext.Provider>
  );
}
export function useLiveQuery() {
  const ctx = useContext(LiveQueryContext);
  if (!ctx) throw new Error("Live Query Context has not been initialized.");
  return ctx;
}
