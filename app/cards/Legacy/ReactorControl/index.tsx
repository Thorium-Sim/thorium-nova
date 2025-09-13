import { useGLTF } from "@react-three/drei";
import { Canvas, useFrame } from "@react-three/fiber";
import { useCardContext } from "@thorium/context/CardContext";
import { useStation } from "@thorium/routes/station/useStation";
import modelUrl from "./Reactor.glb?url";
import { useRef } from "react";
import type { Object3D } from "three";
import Button from "@thorium/ui/Button";
import { Batteries } from "@thorium/cards/Legacy/PowerDistribution/Batteries";
import { q } from "@thorium/context/AppContext";
import { useLiveQuery } from "@thorium/utils/live-query/client";
import useAnimationFrame from "@thorium/hooks/useAnimationFrame";
import { DamageOverlay } from "@thorium/components/DamageOverlay";
export function LegacyReactorControl() {
	const { shipId } = useStation();

	const [systems] = q.legacy.powerDistribution.systems.useNetRequest({
		shipId,
	});
	const [reactors] = q.legacy.reactorControl.reactors.useNetRequest({
		shipId,
	});

	const reactorPower = reactors.reduce(
		(prev, reactor) =>
			prev +
			Math.round(
				reactor.maxOutput * reactor.efficiency * (reactor.offline ? 0 : 1),
			),
		0,
	);
	const reactorEfficiency = reactors.reduce(
		(prev, reactor, i, arr) => prev + reactor.efficiency / arr.length,
		0,
	);
	const systemsPower = systems.reduce((acc, sys) => acc + sys.currentPower, 0);

	return (
		<div className="grid grid-cols-5 grid-rows-3 gap-8 h-full">
			<HeatBars />
			<ReactorModel />
			<Batteries />
			<div className="flex flex-row gap-2 col-span-2 flex-wrap justify-between relative p-4">
				<DamageOverlay systemId={reactors[0].id} />
				{reactors[0].settings.map((s) => (
					<Button
						key={`${s.name}-${s.efficiency}`}
						className={`btn-${s.color} flex-grow`}
						onClick={() =>
							q.legacy.powerDistribution.setReactorEfficiency.netSend({
								shipId,
								efficiency: s.efficiency,
							})
						}
					>
						{s.name}
						{s.efficiency !== null
							? `: ${Math.round(s.efficiency * 100)}%`
							: ""}
					</Button>
				))}
			</div>
			<div className="col-span-2">
				<div className="text-3xl">
					Reactor Setting:{" "}
					{reactors[0].externalPower
						? "External Power"
						: reactors[0].settings.find(
								(s) => s.efficiency === reactors[0].efficiency,
							)?.name || "Custom"}
				</div>
				<div className="text-2xl">
					Reactor Efficiency: {Math.round(reactorEfficiency * 100)}%
				</div>
				<div className="text-xl">Reactor Output: {reactorPower}</div>
				<div className="text-xl">Power Used: {systemsPower}</div>
			</div>
		</div>
	);
}

function ReactorModel() {
	const { cardLoaded } = useCardContext();

	return (
		<Canvas
			className="h-full col-span-2 row-span-2"
			frameloop={cardLoaded ? "always" : "never"}
			camera={{ position: [0, 0, -2] }}
		>
			<Model />
			<ambientLight intensity={0.5} />
			<directionalLight position={[0, 4, 4]} color={0x8888ff} />
			<directionalLight position={[-4, 0, -4]} color={0xff8888} />
		</Canvas>
	);
}

function Model() {
	const model = useGLTF(modelUrl, false);
	const ref = useRef<Object3D>(null);

	useFrame(() => {
		ref.current?.rotateY(0.002);
	});
	return <primitive object={model.scene} ref={ref} />;
}

function HeatBars() {
	const { shipId } = useStation();
	const { cardLoaded } = useCardContext();

	const [reactors] = q.legacy.reactorControl.reactors.useNetRequest({
		shipId,
	});

	const { interpolate } = useLiveQuery();

	const heatBarRef = useRef<HTMLDivElement>(null);
	const coolantBarRef = useRef<HTMLDivElement>(null);

	useAnimationFrame(() => {
		if (!reactors[0]) return;
		const entity = interpolate(reactors[0].id);
		const heat = entity?.z || 0;
		const coolant = entity?.c || 0;
		const heatPercent =
			(heat - reactors[0].nominalHeat) /
			(reactors[0].maxHeat - reactors[0].nominalHeat);
		if (heatBarRef.current) {
			heatBarRef.current.style.height = `${heatPercent * 100}%`;
		}
		if (coolantBarRef.current) {
			coolantBarRef.current.style.height = `${coolant * 100}%`;
		}
	}, cardLoaded);

	return (
		<div className="grid grid-cols-2 grid-rows-[auto_1fr_auto] row-span-3 gap-4 gap-x-8 h-full">
			<p className="text-center">Heat</p>
			<p className="text-center">Coolant</p>
			<div className="relative border border-white/50 flex flex-col justify-end">
				<div
					ref={heatBarRef}
					className="striped-gradient striped-red"
					style={{ height: "0%" }}
				/>
			</div>
			<div className="relative border border-white/50 flex flex-col justify-end">
				<div
					ref={coolantBarRef}
					className="striped-gradient striped-cyan"
					style={{ height: "0%" }}
				/>
			</div>
			<Button
				className="btn-info col-span-2"
				onPointerDown={() => {
					q.legacy.coolantControl.coolSystem.netSend({
						systemId: reactors[0].id,
						cooling: true,
					});
					document.addEventListener(
						"pointerup",
						() => {
							q.legacy.coolantControl.coolSystem.netSend({
								systemId: reactors[0].id,
								cooling: false,
							});
						},
						{ once: true },
					);
				}}
			>
				Coolant
			</Button>
		</div>
	);
}
