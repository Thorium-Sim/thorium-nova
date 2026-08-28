import { useSpring } from "@react-spring/web";
import { useContextBridge } from "@react-three/drei";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { useQueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useGetStarmapStore } from "@thorium/components/Starmap/starmapStore";
import { clientId, q } from "@thorium/context/AppContext";
import useEventListener, { RadarTiltEvent, RadarZoomEvent } from "@thorium/hooks/useEventListener";
import { useGamepadPress } from "@thorium/hooks/useGamepadStore";
import { StationContext, useStation } from "@thorium/routes/station/useStation";
import Button from "@thorium/ui/Button";
import { LiveQueryContext, useLiveQuery } from "@thorium/utils/live-query/client/liveQueryContext";
import { logslider } from "@thorium/utils/logSlider";
import { degToRad } from "@thorium/utils/unitTypes";
import { useWheel } from "@use-gesture/react";
import { type ReactNode, useEffect, useRef, Suspense, useState } from "react";
import {
	UNSAFE_LocationContext,
	UNSAFE_NavigationContext,
	UNSAFE_RouteContext,
} from "react-router";
import {
	Euler,
	type Mesh,
	Quaternion,
	Vector2,
	type Group,
	type OrthographicCamera,
	Vector3,
} from "three";
import { LineMaterial, LineSegments2, LineSegmentsGeometry } from "three-stdlib";
import { radToDeg } from "three/src/math/MathUtils.js";
import { useShallow } from "zustand/shallow";

import { cameraQuaternionMultiplier, forwardQuaternion } from "./constants";
import { DistanceCircle } from "./DistanceCircle";
import { PlayerArrow } from "./PlayerArrow";
import { CircleGirdStoreContext, useCircleGridStore } from "./useCircleGridStore";

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
	useEventListener(RadarZoomEvent.name, (event: RadarZoomEvent) => {
		store.setState({ zoom: event.zoom });
	});
	return null;
};

export function CircleGrid({
	children,
	/** Children that are fixed with the ship */
	fixedChildren,
}: {
	children: ReactNode;
	fixedChildren?: ReactNode;
	rangeMin?: number;
	rangeMax?: number;
}) {
	const store = useCircleGridStore();

	const tilt = store((store) => store.tilt);
	const [zoomMin, zoomMax] = store(useShallow((store) => [store.zoomMin, store.zoomMax]));
	const useStarmapStore = useGetStarmapStore();
	const circleGroup = useRef<Group>(null);
	const tiltRef = useRef(0);
	useSpring({
		tilt,
		onChange: ({ value }) => {
			tiltRef.current = value.tilt;
		},
	});

	const { id, currentSystem } = useStation().ship;

	useEffect(() => {
		useStarmapStore.getState().setCurrentSystem(currentSystem);
	}, [currentSystem, useStarmapStore]);
	const { interpolate } = useLiveQuery();
	useFrame((props) => {
		const playerShip = interpolate(id);
		if (playerShip && circleGroup.current) {
			const { r } = playerShip;
			circleGroup.current.position.set(0, 0, 0);
			circleGroup.current.quaternion.set(r.x, r.y, r.z, r.w).multiply(forwardQuaternion);

			const camera = props.camera as OrthographicCamera;
			const untiltedQuaternion = circleGroup.current.quaternion.clone();
			const tiltedQuaternion = untiltedQuaternion.clone().multiply(cameraQuaternionMultiplier);
			camera.position
				.set(0, zoomMax, 0)
				.applyQuaternion(untiltedQuaternion.slerp(tiltedQuaternion, tiltRef.current));

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
				<RotationLines id={id} />
				{fixedChildren}
			</group>
			<MovementDots id={id} />
			<Suspense fallback={null}>{children}</Suspense>
		</group>
	);
}

const prevQuat = new Quaternion();
const quat = new Quaternion();
const euler = new Euler();
function RotationLines({ id }: { id: number }) {
	const size = useThree((state) => state.size);
	const { interpolate } = useLiveQuery();

	const [geometry] = useState(() => new LineSegmentsGeometry());
	const [line1] = useState(() => new LineSegments2());
	const [line2] = useState(() => new LineSegments2());
	const [line3] = useState(() => new LineSegments2());
	const [lineMaterial1] = useState(
		() =>
			new LineMaterial({
				color: 0x666666,
				resolution: new Vector2(size.width, size.height),
				transparent: true,
				opacity: 1,
			}),
	);
	const [lineMaterial2] = useState(
		() =>
			new LineMaterial({
				color: 0x666666,
				resolution: new Vector2(size.width, size.height),
				transparent: true,
				opacity: 1,
			}),
	);
	const [lineMaterial3] = useState(
		() =>
			new LineMaterial({
				color: 0x666666,
				resolution: new Vector2(size.width, size.height),
				transparent: true,
				opacity: 1,
			}),
	);

	useFrame((props) => {
		const value = interpolate(id);

		if (value?.r) {
			quat.set(value.r.x, value.r.y, value.r.z, value.r.w);
			prevQuat.invert().multiply(quat);
			euler.setFromQuaternion(prevQuat);
			prevQuat.set(value.r.x, value.r.y, value.r.z, value.r.w);
			const rotations = {
				pitch: euler.x,
				yaw: euler.y,
				roll: euler.z,
			};
			line1.rotateY(-rotations.yaw);
			line2.rotateY(rotations.roll);
			line3.rotateY(-rotations.pitch);
			lineMaterial1.opacity = Math.min(1, Math.abs(radToDeg(rotations.yaw) * 20));
			lineMaterial2.opacity = Math.min(1, Math.abs(radToDeg(rotations.roll) * 20));
			lineMaterial3.opacity = Math.min(1, Math.abs(radToDeg(rotations.pitch) * 20));
		}
		const camera = props.camera as OrthographicCamera;
		const dx = ((camera.right - camera.left) / (2 * camera.zoom)) * 0.98;
		const points = Array.from({ length: 36 })
			.flatMap((_, i) => [
				[Math.cos(degToRad(i * 10)) * dx * 0.98, 0, Math.sin(degToRad(i * 10)) * dx * 0.98],
				[Math.cos(degToRad(i * 10)) * dx, 0, Math.sin(degToRad(i * 10)) * dx],
			])
			.flat();
		geometry.setPositions(points);
	});

	return (
		<>
			<primitive object={line1}>
				<primitive object={geometry} attach="geometry" />
				<primitive object={lineMaterial1} attach="material" />
			</primitive>
			<primitive object={line2} rotation={[Math.PI / 2, 0, 0]}>
				<primitive object={geometry} attach="geometry" />
				<primitive object={lineMaterial2} attach="material" />
			</primitive>
			<primitive object={line3} rotation={[0, 0, Math.PI / 2]}>
				<primitive object={geometry} attach="geometry" />
				<primitive object={lineMaterial3} attach="material" />
			</primitive>
		</>
	);
}

const movementDotInterval = 3;
const movementDotLifespan = 30;
const movementDotCount = Math.ceil(movementDotLifespan / movementDotInterval);
const diffVector = new Vector3();
function MovementDots({ id }: { id: number }) {
	const ref = useRef<Mesh[]>([]);
	const previousPosition = useRef<{ x: number; y: number; z: number } | null>(null);
	const timerRef = useRef(0);
	const refIndex = useRef(0);
	const { interpolate } = useLiveQuery();

	useFrame((props, delta) => {
		const playerShip = interpolate(id);
		if (!playerShip) return;
		if (!previousPosition.current) {
			previousPosition.current = playerShip;
			return;
		}

		diffVector.set(
			previousPosition.current.x - playerShip.x,
			previousPosition.current.y - playerShip.y,
			previousPosition.current.z - playerShip.z,
		);

		if (diffVector.lengthSq() > 0) {
			timerRef.current += delta;
		}
		if (timerRef.current >= movementDotInterval) {
			timerRef.current = 0;
			const meshRef = ref.current[refIndex.current]!;
			meshRef.position.set(0, 0, 0);
			if (!Array.isArray(meshRef.material)) {
				meshRef.material.opacity = 1;
			}
			refIndex.current = (refIndex.current + 1) % ref.current.length;
		}

		const camera = props.camera as OrthographicCamera;
		const dx = ((camera.right - camera.left) / (2 * camera.zoom)) * 0.005;
		for (const el of ref.current) {
			if (!el) continue;
			el.scale.setScalar(dx);
			el.position.add(diffVector);
			if (!Array.isArray(el.material)) {
				el.material.opacity -= delta / movementDotLifespan;
			}
		}
		previousPosition.current = playerShip;
	});
	return Array.from({ length: movementDotCount }).map((_, i) => (
		<mesh
			ref={(node) => {
				if (node) {
					ref.current[i] = node;
				}
			}}
			key={i}
		>
			<icosahedronGeometry args={[1, 1]} />
			<meshBasicMaterial color={0x999999} transparent opacity={0} depthWrite={false} />
		</mesh>
	));
}

export function GridCanvas({
	shouldRender,
	children,
	onBackgroundClick,
	outerChildren,
}: {
	shouldRender: boolean;
	children: ReactNode;
	onBackgroundClick?: () => void;
	outerChildren?: ReactNode;
}) {
	const client = useQueryClient();
	const circleGridStore = useCircleGridStore();
	const [zoomMin, zoomMax] = circleGridStore(useShallow((store) => [store.zoomMin, store.zoomMax]));

	const ContextBridge = useContextBridge(
		LiveQueryContext,
		StationContext,
		CircleGirdStoreContext,
		UNSAFE_LocationContext,
		UNSAFE_NavigationContext,
		UNSAFE_RouteContext,
	);

	const wheelBind = useWheel(({ delta: [_, y] }) => {
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
			className="relative aspect-square h-full w-full rounded-full border-2 border-white/50 bg-black/50"
			{...wheelBind()}
		>
			<Canvas
				camera={{
					// position: [0, 300000, 0],
					far: zoomMax * 2,
				}}
				className="rounded-full"
				orthographic
				frameloop={shouldRender ? "always" : "demand"}
				gl={{ antialias: true, logarithmicDepthBuffer: true }}
				onContextMenu={(e) => {
					e.preventDefault();
				}}
				onPointerDown={() => {
					onBackgroundClick?.();
				}}
			>
				<CameraEffects />
				<ContextBridge>
					<QueryClientProvider client={client}>{children}</QueryClientProvider>
				</ContextBridge>
			</Canvas>
			{outerChildren}
		</div>
	);
}

export function CircleGridTiltButton() {
	const circleGridStore = useCircleGridStore();
	function handleTilt() {
		const t = circleGridStore.getState().tilt;
		const tilt = t === 0 ? 0.5 : t === 0.5 ? 1 : 0;
		circleGridStore.setState(() => ({
			tilt,
		}));
		q.thorium.genericEvent.netSend({
			clientId,
			eventName: "radar-tilt",
			properties: `${tilt}`,
		});
	}
	useGamepadPress("pilot-sensor-tilt", {
		onDown: () => {
			handleTilt();
		},
		// TODO: Make it so the button on the webpage responds to the joystick being pressed
		onUp: () => {},
	});

	useEventListener(RadarTiltEvent.name, (event: RadarTiltEvent) => {
		const tilt = event.tilt === 90 ? 1 : event.tilt === 45 ? 0.5 : event.tilt;
		circleGridStore.setState({ tilt });
	});
	return (
		<Button className="btn-primary w-full" onClick={() => handleTilt()}>
			Tilt Radar View
		</Button>
	);
}
