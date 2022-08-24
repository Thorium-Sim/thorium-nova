import {ZoomSlider} from "@thorium/ui/Slider";
import {zoomMax, zoomMin} from "./constants";
import {usePilotStore} from "./usePilotStore";

export function PilotZoomSlider() {
  const zoom = usePilotStore(store => store.zoom);
  const width = usePilotStore(store => store.width);
  return (
    <>
      <p className="text-xl">Zoom:</p>
      <ZoomSlider
        step={0.1}
        zoomMin={width / (zoomMax * 2)}
        zoomMax={width / (zoomMin * 2)}
        value={zoom}
        setValue={zoom => usePilotStore.setState({zoom})}
      />
    </>
  );
}
