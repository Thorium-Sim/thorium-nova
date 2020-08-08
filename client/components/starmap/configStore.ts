import create from "zustand";

export interface ConfigStore {
  disableOrbitControls: () => void;
  enableOrbitControls: () => void;
  universeId: string;
}
const store = create<ConfigStore>(set => ({
  disableOrbitControls: () => {},
  enableOrbitControls: () => {},
  universeId: "",
}));

export const configStoreApi = store[1];
