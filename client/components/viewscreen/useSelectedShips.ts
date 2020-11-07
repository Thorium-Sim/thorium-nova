import create from "zustand";

export const useSelectedShips = create<{
  selectedIds: string[];
  cachedPositions: {[id: string]: {x: number; y: number; z: number}};
}>(() => ({
  selectedIds: [],
  cachedPositions: {},
}));
