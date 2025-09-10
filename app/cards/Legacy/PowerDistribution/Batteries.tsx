import { q } from "@thorium/context/AppContext";
import { useCardContext } from "@thorium/context/CardContext";
import useAnimationFrame from "@thorium/hooks/useAnimationFrame";
import { useStation } from "@thorium/routes/station/useStation";
import { useLiveQuery } from "@thorium/utils/live-query/client";
import { useRef } from "react";

export function Batteries() {
	const { shipId } = useStation();

	const [batteries] = q.legacy.powerDistribution.batteries.useNetRequest({
		shipId,
	});

	return batteries.length > 0 ? (
		<div className="panel max-h-96 h-full px-8 flex flex-col text-center col-span-2 row-span-2">
			Batteries
			<div className="flex justify-between gap-8 flex-auto pt-4">
				{batteries.map((battery, i) => (
					<Battery key={battery.id} index={i} batteries={batteries} />
				))}
			</div>
		</div>
	) : null;
}

function Battery({
	index,
	batteries,
}: { index: number; batteries: { id: number; capacity: number }[] }) {
	const { cardLoaded } = useCardContext();
	const { interpolate } = useLiveQuery();
	const textRef = useRef<HTMLParagraphElement>(null);
	const barRef = useRef<HTMLDivElement>(null);
	useAnimationFrame(() => {
		const collectiveCharge = batteries.reduce(
			(prev, battery) =>
				prev +
				(interpolate(battery.id)?.x || 0) / battery.capacity / batteries.length,
			0,
		);

		const value = Math.min(
			1,
			Math.max(
				0,
				(collectiveCharge - (1 / batteries.length) * index) * batteries.length,
			),
		);

		if (barRef.current) {
			barRef.current.style.height = `${value * 100}%`;
		}
		if (textRef.current) {
			textRef.current.innerText = `${Math.round(value * 100)}%`;
		}
	}, cardLoaded);
	return (
		<div className="w-full flex h-full flex-col">
			<div className="flex-auto flex flex-col justify-end">
				<div
					ref={barRef}
					className="rounded-xl bg-green-500 striped-gradient border-2 border-green-900"
					style={{
						height: `0%`,
					}}
				/>
			</div>
			<p className="tabular-nums text-center" ref={textRef}>
				0%
			</p>
		</div>
	);
}
