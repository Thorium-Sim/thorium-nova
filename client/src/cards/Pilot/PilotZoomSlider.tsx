import useAnimationFrame from "@client/hooks/useAnimationFrame";
import {useGamepadValue} from "@client/hooks/useGamepadStore";
import {ZoomSlider} from "@thorium/ui/Slider";
import {useState} from "react";
import {zoomMax, zoomMin} from "./constants";
import {usePilotStore} from "./usePilotStore";
import {logslider} from "@client/utils/logSlider";

export function PilotZoomSlider() {
  const zoom = usePilotStore(store => store.zoom);
  const width = usePilotStore(store => store.width);

  // Joystick control
  const [zoomAdjust, setZoomAdjust] = useState(0);
  useGamepadValue("zoom-adjust", value => {
    setZoomAdjust(value);
  });
  useAnimationFrame(() => {
    const max = width / (zoomMax * 2);
    const min = width / (zoomMin * 2);
    usePilotStore.setState({
      zoom: logslider(
        max,
        min,
        Math.min(100, Math.max(0, logslider(max, min, zoom, true) + zoomAdjust))
      ),
    });
  }, zoomAdjust !== 0);
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
