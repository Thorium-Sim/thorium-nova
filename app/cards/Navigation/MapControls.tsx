import { useGetStarmapStore } from "@thorium/components/Starmap/starmapStore";
import { q } from "@thorium/context/AppContext";
import { useStation } from "@thorium/routes/station/useStation";
import Button from "@thorium/ui/Button";
import { ZoomSlider } from "@thorium/ui/Slider";
import { useEffect } from "react";

export function MapControls() {
	const { shipId } = useStation();
	const useStarmapStore = useGetStarmapStore();
	const systemId = useStarmapStore((state) => state.currentSystem);
	const [ship] = q.navigation.ship.useNetRequest({ shipId });

	useEffect(() => {
		q.navigation.ship.netRequest({ shipId }).then((res) => {
			useStarmapStore.setState({ followEntityId: res.id });
		});
	}, [useStarmapStore, shipId]);

	useEffect(() => {
		if (useStarmapStore.getState().followEntityId === ship.id) {
			useStarmapStore.getState().setCurrentSystem(ship.position?.parentId || null);
		}
	}, [ship.position?.parentId, useStarmapStore, ship.id]);

	return (
		<div className="max-w-sm space-y-2 self-end">
			<ZoomSliderComp />
			{systemId !== null && (
				<Button
					className="btn-primary pointer-events-auto w-full"
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
				className="btn-warning pointer-events-auto w-full"
				onClick={() => {
					useStarmapStore.setState({
						followEntityId: ship.id,
						currentSystem: ship.position?.parentId || null,
					});

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
					window.dispatchEvent(new Event("starmap-zoom"));
				}}
				zoomMin={minDistance}
				zoomMax={maxDistance}
				step={0.01}
			/>
		</div>
	);
};
