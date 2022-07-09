import {createContext, ReactNode, useContext, useState} from "react";
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
  /** Used for core */
  currentSystem: number | null;
  setCurrentSystem: (systemId: number | null) => void;
}
const createStarmapStore = () =>
  create<StarmapStore>(set => ({
    skyboxKey: "blank",
    viewingMode: "editor",
    selectedObjectId: null,
    cameraControlsEnabled: true,
    setCameraControlsEnabled: (enabled: boolean) =>
      set({cameraControlsEnabled: enabled}),
    hoveredPosition: null,
    cameraView: "3d",
    setCameraView: (view: "2d" | "3d") => set({cameraView: view}),
    currentSystem: null,
    setCurrentSystem: (systemId: number | null) =>
      set({currentSystem: systemId}),
  }));

const useStarmapStore = createStarmapStore();

export const StarmapStoreContext = createContext(useStarmapStore);

export const StarmapStoreProvider = ({children}: {children: ReactNode}) => {
  const [useStarmapStore] = useState<ReturnType<typeof createStarmapStore>>(
    () => createStarmapStore()
  );
  return (
    <StarmapStoreContext.Provider value={useStarmapStore}>
      {children}
    </StarmapStoreContext.Provider>
  );
};

export const useGetStarmapStore = () => {
  return useContext(StarmapStoreContext);
};
