import { q } from "@client/context/AppContext";
import { useFrame } from "@react-three/fiber";
import { useLiveQuery } from "@thorium/live-query/client";
import Nebula from "@client/components/Starmap/Nebula";
import StarmapCanvas from "@client/components/Starmap/StarmapCanvas";
import { useGetStarmapStore } from "@client/components/Starmap/starmapStore";
import {
	InterstellarWrapper,
	SolarSystemWrapper,
} from "@client/cores/StarmapCore";
import { Suspense, useEffect, useState } from "react";
import { Quaternion } from "three";
import { Fuzz } from "./Fuzz";
import { WarpStars } from "./WarpStars";

const forwardQuaternion = new Quaternion(0, 1, 0, 0);

function ViewscreenEffects({ onDone }: { onDone: () => void }) {
	const [viewscreenSystem] = q.viewscreen.system.useNetRequest();
	const [player] = q.ship.player.useNetRequest();
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
		const position = interpolate(player.id);
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
	q.viewscreen.stream.useDataStream();

	return (
		<div className="w-full h-full flex items-center justify-center text-white text-6xl">
			<StarmapCanvas>
				<ViewscreenEffects onDone={() => setInitialized(true)} />
				{initialized ? (
					<>
						<pointLight
							intensity={0.2}
							decay={2}
							position={[10000000, 10000000, 1000000]}
						/>
						<pointLight
							intensity={0.1}
							decay={2}
							position={[-10000000, -10000000, -1000000]}
						/>
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
		</div>
	);
}
