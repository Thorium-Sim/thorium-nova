import { q, clientId } from "@thorium/context/AppContext";
import { useCardContext } from "@thorium/context/CardContext";
import useAnimationFrame from "@thorium/hooks/useAnimationFrame";
import { useGamepadValue } from "@thorium/hooks/useGamepadStore";
import { ZoomSlider } from "@thorium/ui/Slider";
import { logslider } from "@thorium/utils/logSlider";
import throttle from "lodash.throttle";
import { useRef, useState } from "react";
import { useShallow } from "zustand/shallow";

import { useCircleGridStore } from "./useCircleGridStore";

export function PilotZoomSlider() {
	const store = useCircleGridStore();
	const { cardLoaded } = useCardContext();
	const zoom = store((store) => store.zoom);
	const [zoomMin, zoomMax] = store(useShallow((store) => [store.zoomMin, store.zoomMax]));
	const width = store((store) => store.width);
	// Joystick control
	const [zoomAdjust, setZoomAdjust] = useState(0);

	const callback = useRef(
		throttle((zoom) => {
			q.thorium.genericEvent.netSend({
				clientId,
				eventName: "radar-zoom",
				properties: `${zoom}`,
			});
		}, 1000),
	);

	function setZoom(zoom: number) {
		// Trigger the `radar-zoom` event
		callback.current(zoom);
		store.setState({ zoom });
	}

	useGamepadValue("zoom-adjust", (value) => {
		setZoomAdjust(value);
	});
	useGamepadValue("zoom-set", (value) => {
		const max = width / (zoomMax * 1.1 * 2);
		const min = width / (zoomMin * 1.1 * 2);
		setZoom(logslider(max, min, Math.min(100, Math.max(0, ((value + 1) / 2) * 100))));
	});
	useAnimationFrame(
		() => {
			const max = width / (zoomMax * 1.1 * 2);
			const min = width / (zoomMin * 1.1 * 2);
			setZoom(
				logslider(
					max,
					min,
					Math.min(100, Math.max(0, logslider(max, min, zoom, true) + zoomAdjust)),
				),
			);
		},
		zoomAdjust !== 0 && cardLoaded,
	);
	return (
		<>
			<p className="text-xl">Zoom:</p>
			<ZoomSlider
				step={0.1}
				zoomMin={width / (zoomMax * 1.1 * 2)}
				zoomMax={width / (zoomMin * 1.1 * 2)}
				value={zoom}
				setValue={setZoom}
			/>
		</>
	);
}
