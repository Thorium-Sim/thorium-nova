import { createContext, useContext } from "react";

export const SortableHandleContext = createContext<((element: Element | null) => void) | undefined>(
	undefined,
);

export function useSortableHandle() {
	return useContext(SortableHandleContext);
}
