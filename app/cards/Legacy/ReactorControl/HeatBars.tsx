import { useLiveQuery } from "@thorium/utils/live-query/client";
import useAnimationFrame from "@thorium/hooks/useAnimationFrame";
import { useRef } from "react";
import { useCardContext } from "@thorium/context/CardContext";
import { q } from "@thorium/context/AppContext";
import Button from "@thorium/ui/Button";

export function HeatBars({
	id,
	nominalHeat,
	maxHeat,
}: {
	id: number;
	nominalHeat: number;
	maxHeat: number;
}) {
	const { cardLoaded } = useCardContext();

	const { interpolate } = useLiveQuery();

	const heatBarRef = useRef<HTMLDivElement>(null);
	const coolantBarRef = useRef<HTMLDivElement>(null);

	useAnimationFrame(() => {
		const entity = interpolate(id);
		const heat = entity?.z || 0;
		const coolant = entity?.c || 0;
		const heatPercent = (heat - nominalHeat) / (maxHeat - nominalHeat);
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
					className="striped-gradient striped-gradient-error"
					style={{ height: "0%" }}
				/>
			</div>
			<div className="relative border border-white/50 flex flex-col justify-end">
				<div
					ref={coolantBarRef}
					className="striped-gradient striped-gradient-cyan-300"
					style={{ height: "0%" }}
				/>
			</div>
			<Button
				className="btn-info col-span-2"
				onPointerDown={() => {
					q.legacy.coolantControl.coolSystem.netSend({
						systemId: id,
						cooling: true,
					});
					document.addEventListener(
						"pointerup",
						() => {
							q.legacy.coolantControl.coolSystem.netSend({
								systemId: id,
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
