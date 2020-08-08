import create from "zustand";

export interface ConfigStore {
  disableOrbitControls: () => void;
  enableOrbitControls: () => void;
  selectedObject: string | null;
  skyboxKey: string;
}
const store = create<ConfigStore>(set => ({
  disableOrbitControls: () => {},
  enableOrbitControls: () => {},
  selectedObject: null,
  skyboxKey: "Pretty",
}));

export const useConfigStore = store[0];
export const configStoreApi = store[1];
