import { clientId, q } from "@thorium/context/AppContext";
import { useFrame } from "@react-three/fiber";
import { useLiveQuery } from "@thorium/utils/live-query/client";
import Nebula from "@thorium/components/Starmap/Nebula";
import StarmapCanvas from "@thorium/components/Starmap/StarmapCanvas";
import { useGetStarmapStore } from "@thorium/components/Starmap/starmapStore";
import {
	InterstellarWrapper,
	SolarSystemWrapper,
} from "@thorium/cores/StarmapCore";
import { Suspense, useEffect, useMemo, useState } from "react";
import * as THREE from "three";
import { Quaternion, Vector3 } from "three";
import { Fuzz } from "./Fuzz";
import { WarpStars } from "./WarpStars";
import { CircleGridStoreProvider } from "@thorium/cards/Pilot/useCircleGridStore";
import { useStation } from "@thorium/routes/station/useStation";
import { Gizmos } from "./gizmos";
import { NoSignal } from "./NoSignal";

const forwardQuaternion = new Quaternion(0, 1, 0, 0);

function ViewscreenEffects({ onDone }: { onDone: () => void }) {
	const [viewscreenSystem] = q.viewscreen.system.useNetRequest({ clientId });
	const [vsConfig] = q.viewscreen.viewscreenConfig.useNetRequest({ clientId });
	const { shipId } = useStation();
	const { interpolate } = useLiveQuery();

	const useStarmapStore = useGetStarmapStore();
	useEffect(() => {
		useStarmapStore.getState().setCameraControlsEnabled(false);
	}, [useStarmapStore]);
	useEffect(() => {
		useStarmapStore.getState().setCurrentSystem(viewscreenSystem?.id || null);
	}, [viewscreenSystem?.id, useStarmapStore]);
	useEffect(() => {
		useStarmapStore.setState({
			skyboxKey: viewscreenSystem?.skyboxKey || "",
			viewingMode: "viewscreen",
		});
	}, [viewscreenSystem?.skyboxKey, useStarmapStore]);

	// Precompute the camera offset quaternion; recomputes only when yaw/pitch change
	const cameraOffsetQuat = useMemo(() => {
		if (!vsConfig?.cameraYaw && !vsConfig?.cameraPitch) return null;
		const offset = new Quaternion();
		// Negate yaw because Three.js Y-axis rotation is counterclockwise,
		// but positive yaw should mean starboard (right) in the UI
		if (vsConfig.cameraYaw) {
			offset.multiply(
				new Quaternion().setFromAxisAngle(
					new Vector3(0, 1, 0),
					(-vsConfig.cameraYaw * Math.PI) / 180,
				),
			);
		}
		if (vsConfig.cameraPitch) {
			offset.multiply(
				new Quaternion().setFromAxisAngle(
					new Vector3(1, 0, 0),
					(vsConfig.cameraPitch * Math.PI) / 180,
				),
			);
		}
		return offset;
	}, [vsConfig?.cameraYaw, vsConfig?.cameraPitch]);

	useEffect(() => {
		onDone();
	});
	const cameraFov = vsConfig?.cameraFov ?? 45;
	useFrame(({ camera }) => {
		const position = interpolate(shipId);
		if (!position) return;

		camera.position.set(position.x, position.y, position.z);
		camera.quaternion
			.set(position.r.x, position.r.y, position.r.z, position.r.w)
			.multiply(forwardQuaternion);
		if (cameraOffsetQuat) {
			camera.quaternion.multiply(cameraOffsetQuat);
		}
		if ((camera as THREE.PerspectiveCamera).fov !== cameraFov) {
			(camera as THREE.PerspectiveCamera).fov = cameraFov;
			(camera as THREE.PerspectiveCamera).updateProjectionMatrix();
		}
	});

	return null;
}

export function Viewscreen() {
	const useStarmapStore = useGetStarmapStore();
	const currentSystem = useStarmapStore((store) => store.currentSystem);
	const [initialized, setInitialized] = useState(false);
	const [vsConfig] = q.viewscreen.viewscreenConfig.useNetRequest({ clientId });
	const { shipId } = useStation();
	q.viewscreen.stream.useDataStream({ shipId });

	// FD manual override — always kills camera, never affects gizmos
	const isCameraOffline = vsConfig?.camerasOffline;
	// Damage system — what breaks depends on brokenMode
	const damageBroken = vsConfig?.damageBroken;
	const showCamera = !isCameraOffline && !damageBroken;
	const showGizmos =
		vsConfig?.showGizmos !== false &&
		!(damageBroken && vsConfig?.brokenMode === "fullyBroken");

	return (
		<div className="w-full h-full flex items-center justify-center text-white text-6xl bg-black">
			{showCamera ? (
				<CircleGridStoreProvider>
					<StarmapCanvas>
						<ViewscreenEffects onDone={() => setInitialized(true)} />
						{initialized ? (
							<>
								<ambientLight intensity={0.5} />
								<Suspense fallback={null}>
									<Fuzz />
								</Suspense>
								<Suspense fallback={null}>
									<WarpStars />
								</Suspense>
								<Suspense fallback={null}>
									<Nebula />
								</Suspense>
								{currentSystem === null ? (
									<InterstellarWrapper />
								) : (
									<SolarSystemWrapper />
								)}
							</>
						) : null}
					</StarmapCanvas>
				</CircleGridStoreProvider>
			) : (
				<NoSignal />
			)}
			{showGizmos && <Gizmos />}
		</div>
	);
}
