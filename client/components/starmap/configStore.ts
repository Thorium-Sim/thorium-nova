import create from "zustand";

export interface ConfigStore {
  disableOrbitControls: () => void;
  enableOrbitControls: () => void;
}
const store = create<ConfigStore>(set => ({
  disableOrbitControls: () => {},
  enableOrbitControls: () => {},
}));

export const configStoreApi = store[1];
