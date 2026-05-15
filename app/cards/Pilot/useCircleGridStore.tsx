import { type ReactNode, createContext, useContext, useState } from "react";
import { create } from "zustand";

function createCircleGridStore({
	zoomMin = 0.01,
	zoomMax = 10000,
	zoom = 100,
}: {
	zoomMin?: number;
	zoomMax?: number;
	zoom?: number;
}) {
	return create<{
		zoom: number;
		zoomMin: number;
		zoomMax: number;
		tilt: number;
		width: number;
		height: number;
	}>(() => ({
		zoom,
		zoomMin,
		zoomMax,
		tilt: 0,
		width: 0,
		height: 0,
	}));
}

export const CircleGirdStoreContext = createContext<ReturnType<
	typeof createCircleGridStore
> | null>(null);

export function CircleGridStoreProvider({
	zoomMin = 0.01,
	zoomMax = 10000,
	defaultZoom = 100,
	children,
}: {
	zoomMin?: number;
	zoomMax?: number;
	defaultZoom?: number;
	children: ReactNode;
}) {
	const [useCircleGridStore] = useState(() =>
		createCircleGridStore({ zoomMin, zoomMax, zoom: defaultZoom }),
	);
	return (
		<CircleGirdStoreContext.Provider value={useCircleGridStore}>
			{children}
		</CircleGirdStoreContext.Provider>
	);
}

export function useCircleGridStore() {
	const store = useContext(CircleGirdStoreContext);
	if (!store) {
		throw new Error("useCircleGridStore must be used within a CircleGridStoreProvider");
	}
	return store;
}
