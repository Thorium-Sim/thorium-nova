import {useUniverseSystemSubscription} from "client/generated/graphql";
import {Vector3} from "three";
import create from "zustand";
import {persist} from "zustand/middleware";

interface NavigationStore extends Record<string, unknown> {
  selectedObjectId: string | null;
  systemId: string | null;
  playerShipId: string | null;
  playerShipSystemId: string | null;
  cameraPlanetaryVerticalDistance: number;
  disableOrbitControls: () => void;
  enableOrbitControls: () => void;
  orbitControlsSet: (input: {zoom?: number; position?: Vector3}) => void;
  translate2dTo3d?: (x: number, y: number) => Vector3;
}
export const useNavigationStore = create<NavigationStore>(
  persist(
    (set, get) => ({
      cameraPlanetaryVerticalDistance: 0,
      selectedObjectId: null,
      systemId: null,
      playerShipId: null,
      playerShipSystemId: null,
      disableOrbitControls: () => {},
      enableOrbitControls: () => {},
      orbitControlsSet: ({
        zoom,
        position,
      }: {
        zoom?: number;
        position?: Vector3;
      }) => {},
    }),
    {
      name: "thorium-navigation-store", // unique name
      getStorage: () => sessionStorage,
    }
  )
);

export const itemEvents = (entity: {id: string}) => ({
  onPointerOver: () => {
    document.body.style.cursor = "pointer";
  },
  onPointerOut: () => {
    document.body.style.cursor = "auto";
  },
  onClick: () => {
    useNavigationStore.setState({selectedObjectId: entity.id});
  },
});

export type EntityType = NonNullable<
  ReturnType<typeof useUniverseSystemSubscription>["data"]
>["universeSystem"]["items"][0];

export const CAMERA_Y = 30000000;
