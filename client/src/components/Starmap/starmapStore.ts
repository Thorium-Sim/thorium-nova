import create from "zustand";

interface StarmapStore {
  viewingMode: "editor" | "core" | "station" | "viewscreen";
  skyboxKey: string;
  selectedObjectId: string | number | null;
  cameraControlsEnabled: boolean;
  setCameraControlsEnabled: (enabled: boolean) => void;
  hoveredPosition: [number, number, number] | null;
  cameraView: "2d" | "3d";
  setCameraView: (view: "2d" | "3d") => void;
}
export const useStarmapStore = create<StarmapStore>(set => ({
  skyboxKey: "blank",
  viewingMode: "editor",
  selectedObjectId: null,
  cameraControlsEnabled: true,
  setCameraControlsEnabled: (enabled: boolean) =>
    set({cameraControlsEnabled: enabled}),
  hoveredPosition: null,
  cameraView: "3d",
  setCameraView: (view: "2d" | "3d") => set({cameraView: view}),
}));
