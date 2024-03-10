import { useGetStarmapStore } from "@client/components/Starmap/starmapStore";
import { q } from "@client/context/AppContext";
import Button from "@thorium/ui/Button";
import { ZoomSlider } from "@thorium/ui/Slider";
import { useEffect, useRef } from "react";
import { SOLAR_SYSTEM_MAX_DISTANCE } from "@client/components/Starmap/SolarSystemMap";
import { INTERSTELLAR_MAX_DISTANCE } from "@client/components/Starmap/InterstellarMap";
import { lightYearToLightMinute } from "@server/utils/unitTypes";

export function MapControls() {
	const useStarmapStore = useGetStarmapStore();
	const systemId = useStarmapStore((state) => state.currentSystem);
	const [ship] = q.navigation.ship.useNetRequest();

	useEffect(() => {
		q.navigation.ship.netRequest().then((res) => {
			useStarmapStore.setState({ followEntityId: res.id });
		});
	}, [useStarmapStore]);

	useEffect(() => {
		if (useStarmapStore.getState().followEntityId === ship.id) {
			useStarmapStore
				.getState()
				.setCurrentSystem(ship.position?.parentId || null);
		}
	}, [ship.position?.parentId, useStarmapStore, ship.id]);

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
				onClick={() => {
					useStarmapStore.setState({
						followEntityId: ship.id,
						currentSystem: ship.position?.parentId || null,
					});
					const currentSystem = useStarmapStore.getState().currentSystem;
					const y =
						currentSystem === null
							? lightYearToLightMinute(INTERSTELLAR_MAX_DISTANCE)
							: SOLAR_SYSTEM_MAX_DISTANCE;
					if (ship.position) {
						useStarmapStore.getState().setCameraFocus(ship.position);
					}
				}}
			>
				Follow Ship
			</Button>
		</div>
	);
}

export const ZoomSliderComp = () => {
	const useStarmapStore = useGetStarmapStore();
	const cameraZoom = useStarmapStore((store) => store.cameraObjectDistance);
	const cameraControls = useStarmapStore((store) => store.cameraControls);
	const maxDistance = cameraControls?.current?.maxDistance || 30000000000;
	const minDistance = cameraControls?.current?.minDistance || 10000;
	return (
		<div>
			<p className="text-xl">Zoom:</p>
			<ZoomSlider
				value={cameraZoom}
				setValue={(val) => {
					useStarmapStore.getState().cameraControls?.current?.dollyTo(val);
				}}
				zoomMin={minDistance}
				zoomMax={maxDistance}
				step={0.01}
			/>
		</div>
	);
};
