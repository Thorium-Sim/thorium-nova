import { CameraControls } from "@react-three/drei";
import { useThree } from "@react-three/fiber";
import Starfield from "@thorium/components/Starmap/Starfield";
import { useGetStarmapStore } from "@thorium/components/Starmap/starmapStore";
import { type LightYear, lightYearToLightMinute } from "@thorium/utils/unitTypes";
import CameraControlsClass from "camera-controls";
import type * as React from "react";
import { Suspense, useEffect, useRef } from "react";
import { Box3, Vector3 } from "three";

import { useExternalCameraControl } from "./CameraControls";
import { PolarGrid } from "./PolarGrid";

const ACTION = CameraControlsClass.ACTION;

export const INTERSTELLAR_MAX_DISTANCE: LightYear = 2000;

export function InterstellarMap({ children }: { children: React.ReactNode }) {
	const useStarmapStore = useGetStarmapStore();
	const controlsEnabled = useStarmapStore((s) => s.cameraControlsEnabled);
	const cameraView = useStarmapStore((s) => s.cameraView);
	const orbitControls = useRef<CameraControlsClass>(null);
	const { camera } = useThree();
	camera.userData.id = "interstellar-camera";

	useEffect(() => {
		// Set the initial camera position
		orbitControls.current?.setPosition(0, lightYearToLightMinute(INTERSTELLAR_MAX_DISTANCE) / 2, 0);
		const max = lightYearToLightMinute(INTERSTELLAR_MAX_DISTANCE) * 0.75;
		orbitControls.current?.setBoundary(
			new Box3(new Vector3(-max, -max, -max), new Vector3(max, max, max)),
		);
	}, []);

	useEffect(() => {
		if (cameraView === "2d") {
			orbitControls.current?.rotatePolarTo(0, true);
			orbitControls.current?.rotateAzimuthTo(0, true);
		}
	}, [camera, cameraView]);

	useEffect(() => {
		useStarmapStore.setState({ skyboxKey: "blank" });
	}, [useStarmapStore]);
	useExternalCameraControl(orbitControls);

	const viewingMode = useStarmapStore((store) => store.viewingMode);

	const isStation = viewingMode === "station";
	const isViewscreen = viewingMode === "viewscreen";

	return (
		<Suspense fallback={null}>
			<Starfield radius={lightYearToLightMinute(INTERSTELLAR_MAX_DISTANCE)} />
			{!isViewscreen && (
				<>
					<CameraControls
						ref={orbitControls}
						enabled={controlsEnabled}
						maxDistance={lightYearToLightMinute(INTERSTELLAR_MAX_DISTANCE)}
						minDistance={1}
						mouseButtons={{
							left: ACTION.TRUCK,
							right: ACTION.ROTATE,
							middle: ACTION.DOLLY,
							wheel: ACTION.DOLLY,
						}}
						dollyToCursor={isStation}
						dollySpeed={0.5}
					/>
					<PolarGrid
						rotation={[0, (2 * Math.PI) / 12, 0]}
						args={[
							lightYearToLightMinute(INTERSTELLAR_MAX_DISTANCE),
							12,
							20,
							64,
							0xffffff,
							0xffffff,
						]}
					/>
				</>
			)}
			{children}
		</Suspense>
	);
}
