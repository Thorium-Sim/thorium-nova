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
import { Suspense, useEffect, useState } from "react";
import { Quaternion } from "three";
import { Fuzz } from "./Fuzz";
import { WarpStars } from "./WarpStars";
import { CircleGridStoreProvider } from "@thorium/cards/Pilot/useCircleGridStore";
import { useStation } from "@thorium/routes/station/useStation";
import { Gizmos } from "./gizmos";
import { NoSignal } from "./NoSignal";

const forwardQuaternion = new Quaternion(0, 1, 0, 0);

function ViewscreenEffects({ onDone }: { onDone: () => void }) {
	const [viewscreenSystem] = q.viewscreen.system.useNetRequest({ clientId });
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

	useEffect(() => {
		onDone();
	});
	useFrame(({ camera }) => {
		const position = interpolate(shipId);
		if (!position) return;

		camera.position.set(position.x, position.y, position.z);
		camera.quaternion
			.set(position.r.x, position.r.y, position.r.z, position.r.w)
			.multiply(forwardQuaternion);
	});

	return null;
}

export function Viewscreen() {
	const useStarmapStore = useGetStarmapStore();
	const currentSystem = useStarmapStore((store) => store.currentSystem);
	const [initialized, setInitialized] = useState(false);
	const { shipId } = useStation();
	const [camera] = q.viewscreen.camera.useNetRequest({ shipId });
	q.viewscreen.stream.useDataStream({ shipId });

	if (!camera) {
		return <NoSignal />;
	}

	return (
		<div className="w-full h-full flex items-center justify-center text-white text-6xl">
			<CircleGridStoreProvider>
				<StarmapCanvas fov={camera.fov}>
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
			<Gizmos />
		</div>
	);
}
