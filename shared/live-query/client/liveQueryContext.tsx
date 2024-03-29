import React, {
	createContext,
	type ReactNode,
	Suspense,
	useContext,
	useMemo,
} from "react";
import { useDataConnection } from "./useDataConnection";
import type { ClientSocket } from "./clientSocket";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";
import type { InterpolatedSnapshot } from "@thorium/snapshot-interpolation/src/types";
import useAnimationFrame from "./useAnimationFrame";
import { useDataResponse } from "./useDataResponse";

export const LiveQueryContext = createContext<ILiveQueryContext | null>(null);
export type RequestContext = Record<any, any> & { id: string };
interface ILiveQueryContext {
	interpolate: (entityId: number) => null | EntityValues;
	socket: ClientSocket;
	reconnectionState: ReturnType<typeof useDataConnection>["reconnectionState"];
}

const queryClient = new QueryClient();

type EntityValues = {
	x: number;
	y: number;
	z: number;
	s: 1 | 0;
	f: number;
	r: { x: number; y: number; z: number; w: number };
};

const interpolationCache: Record<string, EntityValues> = {};

export function processInterpolation(
	snapshot: InterpolatedSnapshot | undefined,
) {
	if (!snapshot) return {};
	return snapshot.state.forEach((entity) => {
		interpolationCache[entity.id] = {
			x: entity.x,
			y: entity.y,
			z: entity.z,
			f: entity.f,
			s: entity.s,
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
	const { socket, reconnectionState } = useDataConnection(getRequestContext);

	useAnimationFrame(
		() => processInterpolation(socket?.SI.calcInterpolation("x y z f r(quat)")),
		isTestEnv ? false : true,
	);
	const value: ILiveQueryContext = useMemo(() => {
		return {
			interpolate: (entityId: number) => {
				const state = interpolationCache?.[entityId.toString()];

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
				<Suspense>{children}</Suspense>
				{!isTestEnv ? <DataResponse /> : null}
				<ReactQueryDevtools buttonPosition="bottom-right" position="bottom" />
			</QueryClientProvider>
		</LiveQueryContext.Provider>
	);
}
export function useLiveQuery() {
	const ctx = useContext(LiveQueryContext);
	if (!ctx) throw new Error("Live Query Context has not been initialized.");
	return ctx;
}
