import { CameraControls } from "@react-three/drei";
import { useThree } from "@react-three/fiber";
import { q } from "@thorium/context/AppContext";
import { astronomicalUnitToKilometer, type Kilometer } from "@thorium/utils/unitTypes";
import CameraControlsClass from "camera-controls";
import * as React from "react";
import { Suspense, useEffect } from "react";
import { useParams } from "react-router";
import { Box3, Vector3 } from "three";

import { useExternalCameraControl } from "./CameraControls";
import Disc from "./Disc";
import { PolarGrid } from "./PolarGrid";
import { useGetStarmapStore } from "./starmapStore";
import { useSystemIds } from "./useSystemIds";

const ACTION = CameraControlsClass.ACTION;

// 10% further than Neptune's orbit
export const SOLAR_SYSTEM_MAX_DISTANCE: Kilometer = 4_000_000_000 * 1.1;

function HabitableZone({ systemId }: { systemId: string }) {
	const [pluginId, solarSystemId] = useSystemIds();
	const [system] = q.plugin.starmap.get.useNetRequest({
		pluginId,
		solarSystemId: solarSystemId || systemId,
	});
	const scaleUnit = astronomicalUnitToKilometer(1);
	if (!system) return null;
	const { habitableZoneInner, habitableZoneOuter, stars } = system;
	return stars.length > 0 ? (
		<Disc
			habitableZoneInner={habitableZoneInner}
			habitableZoneOuter={habitableZoneOuter}
			scale={[scaleUnit, scaleUnit, scaleUnit]}
		/>
	) : null;
}

export function SolarSystemMap({
	systemId,
	skyboxKey,
	children,
	minDistance = 1,
	maxDistance = SOLAR_SYSTEM_MAX_DISTANCE,
}: {
	systemId?: string;
	skyboxKey: string;
	children?: React.ReactNode;
	minDistance?: number;
	maxDistance?: number;
}) {
	const pluginId = useParams().pluginId;
	const useStarmapStore = useGetStarmapStore();

	const { camera } = useThree();
	const controlsEnabled = useStarmapStore((s) => s.cameraControlsEnabled);
	const cameraView = useStarmapStore((s) => s.cameraView);
	const orbitControls = React.useRef<CameraControlsClass>(null);

	useEffect(() => {
		useStarmapStore.setState({ skyboxKey: skyboxKey || "blank" });
	}, [skyboxKey, useStarmapStore]);

	useEffect(() => {
		// Set the initial camera position
		orbitControls.current?.setPosition(0, 50_000, 0);
		const max = SOLAR_SYSTEM_MAX_DISTANCE * 0.75;
		orbitControls.current?.setBoundary(
			new Box3(new Vector3(-max, -max, -max), new Vector3(max, max, max)),
		);
		useStarmapStore.getState().setCameraControlsEnabled(true);
	}, [camera, useStarmapStore]);

	useEffect(() => {
		if (cameraView === "2d") {
			orbitControls.current?.rotatePolarTo(0, true);
			orbitControls.current?.rotateAzimuthTo(0, true);
		}
	}, [cameraView]);

	useExternalCameraControl(orbitControls);
	const viewingMode = useStarmapStore((store) => store.viewingMode);

	const isViewscreen = viewingMode === "viewscreen";
	return (
		<Suspense fallback={null}>
			{!pluginId || !systemId ? null : <HabitableZone systemId={systemId} />}
			{!isViewscreen && (
				<>
					<CameraControls
						ref={orbitControls}
						enabled={controlsEnabled}
						maxDistance={maxDistance}
						minDistance={minDistance}
						mouseButtons={{
							left: ACTION.TRUCK,
							right: ACTION.ROTATE,
							middle: ACTION.DOLLY,
							wheel: ACTION.DOLLY,
						}}
						dollyToCursor={false}
						dollySpeed={0.5}
					/>
					<PolarGrid
						rotation={[0, (2 * Math.PI) / 12, 0]}
						args={[maxDistance, 12, 20, 64, 0xffffff, 0xffffff]}
					/>
				</>
			)}
			{children}
		</Suspense>
	);
}
