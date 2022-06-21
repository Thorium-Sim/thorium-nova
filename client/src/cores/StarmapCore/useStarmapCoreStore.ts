import create from "zustand";

interface StarmapCoreStore {
  currentSystem: number | null;
  setCurrentSystem: (systemId: number | null) => void;
}
export const useStarmapCoreStore = create<StarmapCoreStore>(set => ({
  currentSystem: null,
  setCurrentSystem: (systemId: number | null) => set({currentSystem: systemId}),
}));
