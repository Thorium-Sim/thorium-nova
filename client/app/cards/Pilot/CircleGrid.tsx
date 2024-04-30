import { useSpring } from "@react-spring/web";
import { useContextBridge } from "@react-three/drei";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { useQueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useWheel } from "@use-gesture/react";
import { useGetStarmapStore } from "@client/components/Starmap/starmapStore";
import { logslider } from "@client/utils/logSlider";
import { type ReactNode, useEffect, useRef, Suspense } from "react";
import {
	UNSAFE_LocationContext,
	UNSAFE_NavigationContext,
	UNSAFE_RouteContext,
} from "react-router-dom";
import { CircleGeometry, type Group, type OrthographicCamera } from "three";
import { cameraQuaternionMultiplier, forwardQuaternion } from "./constants";
import { DistanceCircle } from "./DistanceCircle";
import { PlayerArrow } from "./PlayerArrow";
import {
	CircleGirdStoreContext,
	useCircleGridStore,
} from "./useCircleGridStore";
import {
	LiveQueryContext,
	useLiveQuery,
} from "@thorium/live-query/client/liveQueryContext";
import { q } from "@client/context/AppContext";
import { useGamepadPress } from "@client/hooks/useGamepadStore";
import Button from "@thorium/ui/Button";

const CameraEffects = () => {
	const store = useCircleGridStore();
	const { camera, size } = useThree();
	useEffect(() => {
		store.setState({
			width: size.width,
			height: size.height,
		});
	}, [size, store]);

	const zoom = store((store) => store.zoom);
	useEffect(() => {
		camera.zoom = zoom;
		camera.updateProjectionMatrix();
	}, [camera, zoom]);
	return null;
};

export function CircleGrid({
	children,
}: { children: ReactNode; rangeMin?: number; rangeMax?: number }) {
	const store = useCircleGridStore();

	const tilt = store((store) => store.tilt);
	const [zoomMin, zoomMax] = store((store) => [store.zoomMin, store.zoomMax]);
	const useStarmapStore = useGetStarmapStore();
	const circleGroup = useRef<Group>(null);
	const tiltRef = useRef(0);
	useSpring({
		tilt,
		onChange: ({ value }) => {
			tiltRef.current = value.tilt;
		},
	});

	const [{ id, currentSystem }] = q.ship.player.useNetRequest();

	useEffect(() => {
		useStarmapStore.getState().setCurrentSystem(currentSystem);
	}, [currentSystem, useStarmapStore]);
	const { interpolate } = useLiveQuery();
	useFrame((props) => {
		const playerShip = interpolate(id);

		if (playerShip && circleGroup.current) {
			const { r } = playerShip;
			circleGroup.current.position.set(0, 0, 0);
			circleGroup.current.quaternion
				.set(r.x, r.y, r.z, r.w)
				.multiply(forwardQuaternion);

			const camera = props.camera as OrthographicCamera;
			const untiltedQuaternion = circleGroup.current.quaternion.clone();
			const tiltedQuaternion = untiltedQuaternion
				.clone()
				.multiply(cameraQuaternionMultiplier);
			camera.position
				.set(0, zoomMax, 0)
				.applyQuaternion(
					untiltedQuaternion.slerp(tiltedQuaternion, tiltRef.current),
				);

			camera.quaternion.set(r.x, r.y, r.z, r.w);
			camera.rotateX(-Math.PI / 2 - (Math.PI / 2) * tiltRef.current);
			camera.rotateZ(Math.PI);
		}
	});
	return (
		<group rotation={[0, 0, 0]}>
			<group ref={circleGroup}>
				{Array.from({ length: Math.ceil(Math.log10(zoomMax / zoomMin)) + 1 })
					.flatMap((_, i) => {
						const r = zoomMin * 10 ** i;
						return [r, r * 1.8, r * 2.5, r * 5, r * 7.5];
					})
					.filter((r) => r <= zoomMax)
					.map((r) => (
						<DistanceCircle key={r} radius={r} />
					))}

				<PlayerArrow />
			</group>
			<Suspense fallback={null}>{children}</Suspense>
		</group>
	);
}
export function GridCanvas({
	shouldRender,
	children,
}: {
	shouldRender: boolean;
	children: ReactNode;
}) {
	const client = useQueryClient();
	const circleGridStore = useCircleGridStore();
	const [zoomMin, zoomMax] = circleGridStore((store) => [
		store.zoomMin,
		store.zoomMax,
	]);

	const ContextBridge = useContextBridge(
		LiveQueryContext,
		CircleGirdStoreContext,
		UNSAFE_LocationContext,
		UNSAFE_NavigationContext,
		UNSAFE_RouteContext,
	);

	const wheelBind = useWheel(({ delta: [x, y] }) => {
		circleGridStore.setState((store) => {
			const v = store.zoom;
			const width = store.width;
			const min = width / (zoomMax * 1.1 * 2);
			const max = width / (zoomMin * 1.1 * 2);
			const val = logslider(min, max, v, true) + y / 100;
			const output = Math.max(min, Math.min(max, logslider(min, max, val)));
			return { zoom: output };
		});
	});
	return (
		<div
			className="h-full w-full aspect-square border-2 border-white/50 rounded-full bg-black/50"
			{...wheelBind()}
		>
			<Canvas
				camera={{
					// position: [0, 300000, 0],
					far: 200000,
					zoom: 165,
				}}
				className="rounded-full"
				orthographic
				frameloop={shouldRender ? "always" : "demand"}
				gl={{ antialias: true, logarithmicDepthBuffer: true }}
				onContextMenu={(e) => {
					e.preventDefault();
				}}
			>
				<CameraEffects />
				<ContextBridge>
					<QueryClientProvider client={client}>{children}</QueryClientProvider>
				</ContextBridge>
			</Canvas>
		</div>
	);
}

export function CircleGridTiltButton() {
	const circleGridStore = useCircleGridStore();
	console.log(circleGridStore.getState());
	useGamepadPress("pilot-sensor-tilt", {
		onDown: () => {
			circleGridStore.setState(({ tilt: t }) => ({
				tilt: t === 0 ? 0.5 : t === 0.5 ? 1 : 0,
			}));
		},
		// TODO: Make it so the button on the webpage responds to the joystick being pressed
		onUp: () => {},
	});

	return (
		<Button
			className="w-full btn-primary"
			onClick={() =>
				circleGridStore.setState(({ tilt: t }) => ({
					tilt: t === 0 ? 0.5 : t === 0.5 ? 1 : 0,
				}))
			}
		>
			Tilt Sensor View
		</Button>
	);
}
