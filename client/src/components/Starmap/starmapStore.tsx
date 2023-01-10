import {useFrame} from "@react-three/fiber";
import CameraControls from "camera-controls";
import {
  createContext,
  MutableRefObject,
  ReactNode,
  useContext,
  useState,
} from "react";
import {Coordinates} from "server/src/utils/unitTypes";
import {Vector3} from "three";
import {create} from "zustand";

interface StarmapStore {
  storeCount: number;
  viewingMode: "editor" | "core" | "station" | "viewscreen";
  skyboxKey: string;
  selectedObjectIds: (string | number)[];
  cameraControlsEnabled: boolean;
  setCameraControlsEnabled: (enabled: boolean) => void;
  hoveredPosition: [number, number, number] | null;
  cameraView: "2d" | "3d";
  setCameraView: (view: "2d" | "3d") => void;
  /** Used for core */
  currentSystem: number | null;
  setCurrentSystem: (systemId: number | null) => Promise<void>;
  currentSystemSet?: (value: any) => void;
  cameraVerticalDistance: number;
  cameraControls?: MutableRefObject<CameraControls | null>;
  followEntityId?: number | null;
  yDimensionIndex: number;
  spawnShipTemplate: null | {
    id: string;
    pluginName: string;
    name: string;
    category: string;
    vanity: string;
  };
  translate2DTo3D?: (x: number, y: number) => Vector3;
  setCameraFocus: (position: Coordinates<number>) => void;
  planetsHidden: boolean;
}
let storeCount = 0;
const createStarmapStore = () =>
  create<StarmapStore>((set, get) => ({
    storeCount: storeCount++,
    skyboxKey: "blank",
    viewingMode: "editor",
    selectedObjectIds: [],
    cameraControlsEnabled: true,
    setCameraControlsEnabled: (enabled: boolean) =>
      set({cameraControlsEnabled: enabled}),
    hoveredPosition: null,
    cameraView: "3d",
    setCameraView: (view: "2d" | "3d") => set({cameraView: view}),
    currentSystem: null,
    setCurrentSystem: async (systemId: number | null) => {
      // Resolve the previous promise if it exists
      if (get().currentSystemSet) {
        get().currentSystemSet?.(null);
      }

      let currentSystemSet = (value: any) => {};
      let promise = new Promise(res => (currentSystemSet = res));
      set({currentSystemSet, currentSystem: systemId});
      await promise;
    },
    cameraVerticalDistance: 0,
    yDimensionIndex: 0,
    spawnShipTemplate: null,
    setCameraFocus: async position => {
      const viewingMode = get().viewingMode;
      const cameraControls = get().cameraControls?.current;
      if (viewingMode === "core") {
        if (position && cameraControls) {
          const camera = cameraControls.camera;
          const up = camera.up.clone();
          camera.up.set(0, 0, -1);
          await cameraControls.setLookAt(
            camera.position.x,
            camera.position.y,
            camera.position.z,
            position.x,
            position.y,
            position.z,
            true
          );
          camera.up.copy(up);
        }
      }
    },
    planetsHidden: false,
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

const distanceVector = new Vector3();
export function useCalculateVerticalDistance() {
  const useStarmapStore = useGetStarmapStore();
  useFrame(({camera}) => {
    const distance = camera.position.distanceTo(
      distanceVector.set(camera.position.x, 0, camera.position.z)
    );
    useStarmapStore.setState({
      cameraVerticalDistance: distance,
    });
  });
}
