import { useGetStarmapStore } from "@thorium/components/Starmap/starmapStore";
import { useEffect } from "react";

export function useExternalCameraControl(controls: React.RefObject<any>) {
	const useStarmapStore = useGetStarmapStore();
	// biome-ignore lint/correctness/useExhaustiveDependencies:
	useEffect(() => {
		if (controls) {
			useStarmapStore.setState({
				cameraControls: controls,
			});
		}
	}, [controls]);
}
