import {useGetStarmapStore} from "client/src/components/Starmap/starmapStore";
import Button from "@thorium/ui/Button";

export function MapControls() {
  const useStarmapStore = useGetStarmapStore();
  const systemId = useStarmapStore(state => state.currentSystem);

  return (
    <div className="self-end max-w-sm space-y-2">
      <ZoomSliderComp />
      {systemId !== null && (
        <Button
          className="w-full btn-primary pointer-events-auto"
          onClick={() => {
            useStarmapStore.setState({
              currentSystem: null,
              selectedObjectId: null,
            });
          }}
        >
          Interstellar View
        </Button>
      )}
      <Button className="w-full btn-warning pointer-events-auto">
        Recenter
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
