import type { SyntheticListenerMap } from "@dnd-kit/core/dist/hooks/utilities";
import { createContext, useContext } from "react";

export const SortableListenerContext = createContext<
	SyntheticListenerMap | undefined
>(undefined);

export function useSortableListener() {
	return useContext(SortableListenerContext);
}
