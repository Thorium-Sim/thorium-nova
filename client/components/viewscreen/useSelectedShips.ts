import create from "zustand";

export const useSelectedShips = create<{selectedIds: string[]}>(() => ({
  selectedIds: [],
}));
