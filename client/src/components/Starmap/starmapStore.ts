import {Vector3} from "three";
import create from "zustand";

interface StarmapStore {
  viewingMode: "editor" | "core" | "station" | "viewscreen";
  skyboxKey: string;
  selectedObjectId: string | null;
  cameraControlsEnabled: boolean;
  setCameraControlsEnabled: (enabled: boolean) => void;
  pluginId: string | null;
  systemId: string | null;
  setSystemId: (systemId: string | null) => void;
  hoveredPosition: [number, number, number] | null;
}
export const useStarmapStore = create<StarmapStore>(set => ({
  skyboxKey: "blank",
  viewingMode: "editor",
  selectedObjectId: null,
  cameraControlsEnabled: true,
  setCameraControlsEnabled: (enabled: boolean) =>
    set({cameraControlsEnabled: enabled}),
  pluginId: null,
  systemId: null,
  setSystemId: (systemId: string | null) => set({systemId: systemId}),
  hoveredPosition: null,
}));
