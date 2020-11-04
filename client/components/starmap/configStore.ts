import {
  TemplateSystemSubscription,
  UniverseAddSystemMutation,
  UniverseSubscription,
} from "../../generated/graphql";
import create from "zustand";
import {Vector3} from "three";

type StarmapObject =
  | NonNullable<UniverseSubscription["pluginUniverse"]>[0]
  | NonNullable<TemplateSystemSubscription["pluginUniverseSystem"]["items"]>[0]
  | NonNullable<TemplateSystemSubscription["pluginUniverseSystem"]>
  | NonNullable<UniverseAddSystemMutation["pluginUniverseAddSystem"]>
  | null;
export interface ConfigStore extends Record<string | number | symbol, unknown> {
  disableOrbitControls: () => void;
  enableOrbitControls: () => void;
  orbitControlsTrackPosition: (position: Vector3, distance?: number) => void;
  setUniverseId: (s: string) => void;
  universeId: string;
  setSystemId: (s: string) => Promise<void>;
  systemId: string;
  // This is used to indicate that the transition from interstellar
  // to planetary is complete.
  transitionPromise: (() => void) | null;
  selectedObject: StarmapObject;
  trackedObjectId: string | null;
  zoomTarget: Vector3 | null;
  skyboxKey: string;
  currentSystem: NonNullable<
    TemplateSystemSubscription["pluginUniverseSystem"]
  > | null;
  // Used for distance measurement
  measuring: boolean;
  // We need scaled positions for situations where
  // the scale and distance of things is different in
  // the editor, such as for moons
  scaledHoveredPosition: Vector3 | null;
  scaledSelectedPosition: Vector3 | null;
  hoveredPosition: Vector3 | null;
  selectedPosition: Vector3 | null;
  viewingMode: "core" | "editor" | "viewscreen";
  // Core
  cameraVerticalDistance: number;
  orbitControlsSet: (input: {zoom?: number; position?: Vector3}) => void;
  includeAutopilotData: boolean;
  compressYDimension: boolean;
  hidePlanets: boolean;
}
const store = create<ConfigStore>(set => ({
  disableOrbitControls: () => {},
  enableOrbitControls: () => {},
  orbitControlsTrackPosition: () => {},
  setUniverseId: (id: string) => set({universeId: id}),
  universeId: "",
  setSystemId: (id: string) => {
    return new Promise(resolve => {
      set({systemId: id, transitionPromise: resolve});
    });
  },
  systemId: "",
  transitionPromise: null,
  selectedObject: null,
  trackedObjectId: null,
  zoomTarget: null,
  skyboxKey: "blank",
  currentSystem: null,
  measuring: false,
  scaledHoveredPosition: null,
  scaledSelectedPosition: null,
  hoveredPosition: null,
  selectedPosition: null,
  viewingMode: "editor",
  // Core
  cameraVerticalDistance: 0,
  orbitControlsSet: ({
    zoom,
    position,
  }: {
    zoom?: number;
    position?: Vector3;
  }) => {},
  includeAutopilotData: true,
  compressYDimension: true,
  hidePlanets: false,
}));

export const useConfigStore = store;
export const configStoreApi = store;
