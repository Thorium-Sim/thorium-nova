import useAnimationFrame from "@thorium/hooks/useAnimationFrame";
import { useGamepadValue } from "@thorium/hooks/useGamepadStore";
import { ZoomSlider } from "@thorium/ui/Slider";
import { useState } from "react";
import { useCircleGridStore } from "./useCircleGridStore";
import { logslider } from "@thorium/utils/logSlider";
import { useShallow } from "zustand/shallow";
import { useCardContext } from "@thorium/context/CardContext";

export function PilotZoomSlider() {
	const store = useCircleGridStore();
	const { cardLoaded } = useCardContext();
	const zoom = store((store) => store.zoom);
	const [zoomMin, zoomMax] = store(
		useShallow((store) => [store.zoomMin, store.zoomMax]),
	);
	const width = store((store) => store.width);
	// Joystick control
	const [zoomAdjust, setZoomAdjust] = useState(0);
	useGamepadValue("zoom-adjust", (value) => {
		setZoomAdjust(value);
	});
	useGamepadValue("zoom-set", (value) => {
		const max = width / (zoomMax * 1.1 * 2);
		const min = width / (zoomMin * 1.1 * 2);
		store.setState({
			zoom: logslider(
				max,
				min,
				Math.min(100, Math.max(0, ((value + 1) / 2) * 100)),
			),
		});
	});
	useAnimationFrame(
		() => {
			const max = width / (zoomMax * 1.1 * 2);
			const min = width / (zoomMin * 1.1 * 2);
			store.setState({
				zoom: logslider(
					max,
					min,
					Math.min(
						100,
						Math.max(0, logslider(max, min, zoom, true) + zoomAdjust),
					),
				),
			});
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
				setValue={(zoom) => store.setState({ zoom })}
			/>
		</>
	);
}
