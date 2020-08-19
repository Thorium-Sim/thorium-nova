import {UniverseSubscription} from "../../generated/graphql";
import create from "zustand";
import {Vector3} from "three";

export interface ConfigStore {
  disableOrbitControls: () => void;
  enableOrbitControls: () => void;
  setUniverseId: (s: string) => void;
  universeId: string;
  setSystemId: (s: string) => void;
  systemId: string;
  selectedObject:
    | NonNullable<UniverseSubscription["universe"]>["systems"][0]
    | null;
  zoomTarget: Vector3 | null;
  skyboxKey: string;
}
const store = create<ConfigStore>(set => ({
  disableOrbitControls: () => {},
  enableOrbitControls: () => {},
  setUniverseId: (id: string) => set({universeId: id}),
  universeId: "",
  setSystemId: (id: string) => set({systemId: id}),
  systemId: "",
  selectedObject: null,
  zoomTarget: null,
  skyboxKey: "Pretty",
}));

export const useConfigStore = store;
export const configStoreApi = store;
