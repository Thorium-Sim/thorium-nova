import { q } from "@thorium/context/AppContext";
import { useCardContext } from "@thorium/context/CardContext";
import useAnimationFrame from "@thorium/hooks/useAnimationFrame";
import { useStation } from "@thorium/routes/station/useStation";
import Slider from "@thorium/ui/Slider";
import { SVGImageLoader } from "@thorium/ui/SVGImageLoader";

import "./style.css";

import { cn } from "@thorium/utils/cn";
import { useLiveQuery } from "@thorium/utils/live-query/client";
import chroma from "chroma-js";
import { Fragment, useEffect, useRef } from "react";

import pinwheel from "./pinwheel.svg?url";
import pump from "./pump.svg?url";
import tankBg from "./tank-bg.svg?url";
import tank from "./tank.svg?url";

const HOT_COLOR = chroma.oklch(0.6, 0.18, 27);
const COLD_COLOR = chroma.oklch(0.6, 0.18, 250);

function mixHeatColors(ratio: number) {
	const [l, c, h] = COLD_COLOR.mix(HOT_COLOR, ratio, "oklab").oklch();
	return `oklch(${l.toFixed(4)} ${c.toFixed(4)} ${h.toFixed(2)})`;
}

function RadiatorFin() {
	return (
		<div className="w-11/12 grow -skew-6 border-2 border-white/50 bg-linear-330 from-black to-violet-950"></div>
	);
}

export function CoolantLoop() {
	const { cardLoaded } = useCardContext();
	const { shipId } = useStation();
	const tankRef = useRef<HTMLDivElement>(null);
	const baseRef = useRef<HTMLDivElement>(null);
	const radiatorHeatRef = useRef<HTMLParagraphElement>(null);
	const coolantTankHeatRef = useRef<HTMLParagraphElement>(null);
	const [systems] = q.coolantLoop.systems.useNetRequest({ shipId });
	const [{ coolantPump, coolantRadiator, coolantTank }] = q.coolantLoop.get.useNetRequest({
		shipId,
	});
	q.coolantLoop.stream.useDataStream({ shipId });
	const { interpolate } = useLiveQuery();

	useAnimationFrame(() => {
		if (!tankRef.current) return;
		const tank = interpolate(coolantTank.id);
		tankRef.current.style.height = `${tank ? (tank.x / coolantTank.capacity) * 100 : 100}%`;

		const radiator = interpolate(coolantRadiator.id);
		const pump = interpolate(coolantPump.id);
		const radiatorRatio =
			((radiator?.z || 1) - coolantRadiator.nominalHeat) /
			(coolantRadiator.maxSafeHeat - coolantRadiator.nominalHeat);
		const tankRatio =
			((tank?.z || 1) - coolantTank.nominalHeat) /
			(coolantTank.maxSafeHeat - coolantTank.nominalHeat);
		const pumpRatio =
			((pump?.z || 1) - coolantPump.nominalHeat) /
			(coolantPump.maxSafeHeat - coolantPump.nominalHeat);
		baseRef.current?.style.setProperty("--radiatorColor", mixHeatColors(radiatorRatio));
		baseRef.current?.style.setProperty("--tankColor", mixHeatColors(tankRatio));
		baseRef.current?.style.setProperty("--pumpColor", mixHeatColors(pumpRatio));

		if (radiatorHeatRef.current) {
			radiatorHeatRef.current.textContent = radiator ? `${radiator?.z.toFixed(0)}K` : "";
		}
		if (coolantTankHeatRef.current) {
			coolantTankHeatRef.current.textContent = tank ? `${tank?.z.toFixed(0)}K` : "";
		}
	}, cardLoaded);

	return (
		<div
			className="grid h-full grid-cols-[12rem_1fr_3rem_1fr_2px_3rem_3rem_3rem_2px_2fr_2px_3rem_auto_1rem_3rem_3fr_3rem_3fr] grid-rows-[3rem_2px_auto_1rem_3rem_1fr_1rem_2px_3rem]"
			style={
				{
					"--radiatorColor": `oklch(60% 0.18 27.518)`,
					"--tankColor": `oklch(60% 0.18 259.815)`,
					"--pumpColor": `oklch(60% 0.18 55.934)`,
				} as Record<string, string>
			}
			ref={baseRef}
		>
			{/* Radiator */}
			<div className="col-start-1 row-span-9 row-start-1 flex flex-col">
				{Array.from({ length: 15 }).map((_, i) => (
					<RadiatorFin key={i} />
				))}
			</div>
			<div className="col-start-2 row-start-1">
				<p>Radiator</p>
				<p className="tabular-nums" ref={radiatorHeatRef}>
					250K
				</p>
			</div>

			{/* Coolant Tank */}
			<div className="col-span-11 col-start-2 row-span-3 row-start-1 flex flex-col items-center">
				<div className="relative max-w-3/4">
					<div
						className="absolute bottom-0 left-0 h-full w-full"
						style={{
							clipPath: `polygon(0 20%, 2% 20%, 2% 100%, 98% 100%, 98% 20%, 98% 15%, 90.5% 8%, 80% 4%, 65% 1%, 50% 0, 35% 1%, 20% 4%, 9.5% 8%, 2% 15%, 2% 20%, 0 20%)`,
						}}
					>
						<div
							className="absolute bottom-0 w-full"
							ref={tankRef}
							style={{
								background: `linear-gradient(180deg in lab, var(--pumpColor), var(--tankColor))`,
							}}
						/>
					</div>
					<SVGImageLoader url={tank} className="absolute w-full" />
					<SVGImageLoader url={tankBg} className="w-full" />
				</div>
			</div>
			<div className="col-start-10 row-start-1 pr-4 text-right">
				<p>Coolant Tank</p>
				<p className="tabular-nums" ref={coolantTankHeatRef}>
					250K
				</p>
			</div>

			{/* Pipes */}
			<div
				className={cn("col-span-2 col-start-1 row-start-5 border-y-2 border-white/50", {
					"bg-(--tankColor)": coolantRadiator.inCoolantLoop,
					"bg-black": !coolantRadiator.inCoolantLoop,
				})}
			/>
			<div className="col-span-2 col-start-4 row-start-5 border-y-2 border-white/50 bg-(--tankColor)" />
			<div className="col-span-2 col-start-5 row-start-4 border-x-2 border-white/50 bg-(--tankColor)" />
			<div className="col-start-6 row-start-5 rounded-br-lg border-r-2 border-b-2 border-white/50 bg-(--tankColor)" />
			<div className="col-span-2 col-start-8 row-start-4 border-x-2 border-white/50 bg-(--pumpColor)" />
			<div className="col-start-8 row-start-5 rounded-bl-lg border-b-2 border-l-2 border-white/50 bg-(--pumpColor)" />
			<div className="col-span-3 col-start-9 row-start-5 border-y-2 border-white/50 bg-(--pumpColor)" />
			<div className="col-span-2 col-start-11 row-span-3 row-start-2 border-x-2 border-white/50 bg-(--pumpColor)" />
			<div className="col-start-12 row-start-5 rounded-br-lg border-r-2 border-b-2 border-white/50 bg-(--pumpColor)" />
			<div className="col-span-2 col-start-11 row-start-1 rounded-tl-lg border-t-2 border-l-2 border-white/50 bg-(--pumpColor)" />
			<div className="col-span-2 col-start-14 row-span-2 row-start-1 border-y-2 border-white/50 bg-(--pumpColor)" />
			<div className="col-start-15 row-span-2 row-start-1 border-t-2 border-white/50 bg-(--pumpColor)" />
			<div className="col-start-16 row-span-2 row-start-1 border-y-2 border-white/50 bg-(--pumpColor)" />
			<div className="col-start-17 row-start-1 rounded-tr-lg border-t-2 border-r-2 border-white/50 bg-(--pumpColor)" />
			<div className="col-span-14 col-start-1 row-span-2 row-start-8 border-y-2 border-white/50 bg-(--radiatorColor)" />
			<div className="col-start-15 row-span-2 row-start-8 border-b-2 border-white/50 bg-(--radiatorColor)" />
			<div className="col-span-1 col-start-16 row-span-2 row-start-8 border-y-2 border-white/50 bg-(--radiatorColor)" />
			<div className="col-start-17 row-span-2 row-start-8 rounded-br-lg border-r-2 border-b-2 border-white/50 bg-(--radiatorColor)" />
			<div
				className="col-start-3 row-span-3 row-start-6 border-x-2 border-white/50"
				style={{
					background: coolantRadiator.inCoolantLoop
						? "black"
						: `linear-gradient(180deg in lab, var(--tankColor), var(--radiatorColor))`,
				}}
			/>

			<div
				className="col-start-15 row-span-7 row-start-2 border-x-2 border-white/50"
				style={{
					background: `linear-gradient(180deg in lab, var(--pumpColor), var(--radiatorColor))`,
				}}
			/>
			<div
				className="col-start-17 row-span-7 row-start-2 border-x-2 border-white/50"
				style={{
					background: `linear-gradient(180deg in lab, var(--pumpColor), var(--radiatorColor))`,
				}}
			/>

			{/* Radiator Coolant Valve */}
			<label className="relative col-start-3 row-start-5 flex items-center justify-center border-2 border-white/50 bg-black">
				<input
					type="checkbox"
					className="peer absolute"
					defaultChecked={coolantRadiator.inCoolantLoop}
					onChange={async (e) => {
						await q.coolantLoop.setSystemCooling.netSend({
							systemId: coolantRadiator.id,
							cooling: e.currentTarget.checked,
						});
					}}
				></input>
				<div
					aria-label="Open coolant valve"
					className="relative h-1/3 w-1/3 rounded-full bg-white transition-transform peer-checked:rotate-90 after:absolute after:top-1/2 after:left-1/2 after:h-[250%] after:w-1/2 after:-translate-1/2 after:rounded-xs after:bg-white after:content-['']"
				/>
			</label>
			{/* Systems */}
			<div className="col-span-4 col-start-15 row-span-7 row-start-2 grid grid-cols-subgrid">
				{systems.map((s) => (
					<Fragment key={s.id}>
						<div></div>
						<SystemCoolantLoop
							systemId={s.id}
							name={s.name}
							nominalHeat={s.nominalHeat}
							maxSafeHeat={s.maxSafeHeat}
						/>
					</Fragment>
				))}
			</div>

			{/* Pump */}
			<Slider
				label="Pump Speed"
				minValue={coolantPump.requiredPower}
				maxValue={coolantPump.maxSafePower}
				defaultValue={coolantPump.powerDraw}
				step={0.1}
				className="col-span-5 col-start-6 row-start-6"
				onChange={(e) => {
					if (Array.isArray(e)) return;
					q.coolantLoop.setPumpPower.netSend({
						pumpId: coolantPump.id,
						power: e,
					});
				}}
			/>

			<PumpPinwheel speed={coolantPump.powerDraw} />
		</div>
	);
}

function PumpPinwheel({ speed }: { speed: number }) {
	const pinwheelRef = useRef<HTMLDivElement>(null);
	useEffect(() => {
		for (const animation of pinwheelRef.current?.getAnimations({ subtree: true }) || []) {
			animation.updatePlaybackRate(speed);
		}
	}, [speed]);
	return (
		<>
			<SVGImageLoader url={pinwheel} className="col-start-1 row-start-1" />
			<div className="relative col-span-4 col-start-5 row-span-4 row-start-6 h-64 translate-y-2 self-end">
				<SVGImageLoader url={pump} className="absolute z-10 h-64 w-64" />
				<div className="absolute top-5 left-10 aspect-square h-48 rounded-full bg-black" />
				<div
					ref={pinwheelRef}
					className="pinwheel-rotate absolute top-5 left-5 aspect-square h-48 after:absolute after:h-full after:w-full after:bg-linear-120 after:from-gray-100 after:via-gray-800 after:to-gray-50"
					style={{
						clipPath: `url(#pump-pinwheel)`,
					}}
				></div>
			</div>
		</>
	);
}

function SystemCoolantLoop({
	systemId,
	name,
	nominalHeat,
	maxSafeHeat,
}: {
	systemId: number;
	name: string;
	nominalHeat: number;
	maxSafeHeat: number;
}) {
	const baseRef = useRef<HTMLDivElement>(null);
	const textRef = useRef<HTMLSpanElement>(null);
	const { interpolate } = useLiveQuery();
	const { cardLoaded } = useCardContext();

	useAnimationFrame(() => {
		const system = interpolate(systemId);
		if (!system) return;
		const ratio = ((system?.z || 1) - nominalHeat) / (maxSafeHeat - nominalHeat);
		baseRef.current?.style.setProperty("--heatColor", mixHeatColors(ratio));

		if (textRef.current) {
			textRef.current.textContent = `${system?.z.toFixed(0)}K`;
		}
	}, cardLoaded);

	let abortControllerRef = useRef(new AbortController());
	useEffect(() => {
		return () => {
			abortControllerRef.current.abort();
		};
	}, []);
	return (
		<div ref={baseRef} style={{ "--heatColor": "black" } as any}>
			<p className="pl-4">
				{name} <span className="tabular-nums" ref={textRef} />
			</p>
			<div className="grid -translate-x-4 grid-cols-[2rem_1fr_2px_1rem] grid-rows-[2px_1fr_2px_1fr_2px] pr-4">
				<button
					className="group row-span-5 flex h-8 w-8 items-center justify-center border-2 border-white/50 bg-black"
					onPointerDown={async () => {
						abortControllerRef.current.abort();
						await q.coolantLoop.setSystemCooling.netSend({ systemId, cooling: true });
						abortControllerRef.current = new AbortController();
						abortControllerRef.current.signal.addEventListener("abort", async () => {
							await q.coolantLoop.setSystemCooling.netSend({ systemId, cooling: false });
						});
						document.addEventListener(
							"pointerup",
							() => {
								abortControllerRef.current.abort();
							},
							{ once: true },
						);
					}}
				>
					<div
						aria-label="Open coolant valve"
						className="relative h-1/3 w-1/3 rounded-full bg-white transition-transform group-active:rotate-90 after:absolute after:top-1/2 after:left-1/2 after:h-[250%] after:w-1/2 after:-translate-1/2 after:rounded-xs after:bg-white after:content-['']"
					/>
				</button>
				<div className="col-span-2" />
				<div className="col-span-2 border-y-2 border-white/50 bg-(--heatColor)" />
				<div className="border-t-2 border-r-2 border-white/50 bg-(--heatColor)" />
				<div className="" />
				<div className="col-span-2 border-x-2 border-white/50 bg-(--heatColor)" />
				<div className="col-span-2 border-y-2 border-white/50 bg-(--heatColor)" />
				<div className="border-r-2 border-b-2 border-white/50 bg-(--heatColor)" />
			</div>
		</div>
	);
}
