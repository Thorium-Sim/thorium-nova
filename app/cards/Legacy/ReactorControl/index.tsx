import { useGLTF } from "@react-three/drei";
import { Canvas, useFrame } from "@react-three/fiber";
import { Batteries } from "@thorium/cards/Legacy/PowerDistribution/Batteries";
import { HeatBars } from "@thorium/cards/Legacy/ReactorControl/HeatBars";
import { DamageOverlay } from "@thorium/components/DamageOverlay";
import { q } from "@thorium/context/AppContext";
import { useCardContext } from "@thorium/context/CardContext";
import { useStation } from "@thorium/routes/station/useStation";
import Button from "@thorium/ui/Button";
import { useRef } from "react";
import type { Object3D } from "three";

import modelUrl from "./Reactor.glb?url";
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
			prev + Math.round(reactor.maxOutput * reactor.efficiency * (reactor.offline ? 0 : 1)),
		0,
	);
	const reactorEfficiency = reactors.reduce(
		(prev, reactor, i, arr) => prev + reactor.efficiency / arr.length,
		0,
	);
	const systemsPower = systems.reduce((acc, sys) => acc + sys.currentPower, 0);

	return (
		<div className="grid h-full grid-cols-5 grid-rows-3 gap-8">
			<HeatBars
				id={reactors[0].id}
				nominalHeat={reactors[0].nominalHeat}
				maxHeat={reactors[0].maxHeat}
			/>
			<ReactorModel />
			<Batteries />
			<div className="relative col-span-2 flex flex-row flex-wrap justify-between gap-2 p-4">
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
						{s.efficiency !== null ? `: ${Math.round(s.efficiency * 100)}%` : ""}
					</Button>
				))}
			</div>
			<div className="col-span-2">
				<div className="text-3xl">
					Reactor Setting:{" "}
					{reactors[0].externalPower
						? "External Power"
						: reactors[0].settings.find((s) => s.efficiency === reactors[0].efficiency)?.name ||
							"Custom"}
				</div>
				<div className="text-2xl">Reactor Efficiency: {Math.round(reactorEfficiency * 100)}%</div>
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
			className="col-span-2 row-span-2 h-full"
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
