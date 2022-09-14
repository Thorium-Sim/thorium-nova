import {useGetStarmapStore} from "client/src/components/Starmap/starmapStore";
import Button from "@thorium/ui/Button";
import {ZoomSlider} from "@thorium/ui/Slider";
import {useNetRequest} from "client/src/context/useNetRequest";
import {useEffect, useRef} from "react";
export function MapControls() {
  const useStarmapStore = useGetStarmapStore();
  const systemId = useStarmapStore(state => state.currentSystem);
  const rendered = useRef(false);
  const ship = useNetRequest("navigationShip", {}, ship => {
    // Follow the player ship on first render
    if (!rendered.current) {
      rendered.current = true;
      useStarmapStore.setState({followEntityId: ship.id});
    }
  });

  useEffect(() => {
    if (useStarmapStore.getState().followEntityId === ship.id) {
      useStarmapStore
        .getState()
        .setCurrentSystem(ship.position?.parentId || null);
    }
  }, [ship.position?.parentId]);

  return (
    <div className="self-end max-w-sm space-y-2">
      <ZoomSliderComp />
      {systemId !== null && (
        <Button
          className="w-full btn-primary pointer-events-auto"
          onClick={() => {
            useStarmapStore.setState({
              currentSystem: null,
              selectedObjectIds: [],
            });
          }}
        >
          Interstellar View
        </Button>
      )}
      <Button
        className="w-full btn-warning pointer-events-auto"
        onClick={() =>
          useStarmapStore.setState({
            followEntityId: ship.id,
            currentSystem: ship.position?.parentId || null,
          })
        }
      >
        Follow Ship
      </Button>
    </div>
  );
}

export const ZoomSliderComp = () => {
  const useStarmapStore = useGetStarmapStore();
  const cameraZoom = useStarmapStore(store => store.cameraVerticalDistance);
  const cameraControls = useStarmapStore(store => store.cameraControls);
  const maxDistance = cameraControls?.current?.maxDistance || 30000000000;
  const minDistance = cameraControls?.current?.minDistance || 10000;
  return (
    <div>
      <p className="text-xl">Zoom:</p>
      <ZoomSlider
        value={cameraZoom}
        setValue={val => {
          useStarmapStore.getState().cameraControls?.current?.dollyTo(val);
        }}
        zoomMin={minDistance}
        zoomMax={maxDistance}
        step={0.01}
      />
    </div>
  );
};
