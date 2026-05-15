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
		<div className="panel col-span-2 row-span-2 flex h-full max-h-96 flex-col px-8 text-center">
			Batteries
			<div className="flex flex-auto justify-between gap-8 pt-4">
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
}: {
	index: number;
	batteries: { id: number; capacity: number }[];
}) {
	const { cardLoaded } = useCardContext();
	const { interpolate } = useLiveQuery();
	const textRef = useRef<HTMLParagraphElement>(null);
	const barRef = useRef<HTMLDivElement>(null);
	useAnimationFrame(() => {
		const collectiveCharge = batteries.reduce(
			(prev, battery) =>
				prev + (interpolate(battery.id)?.x || 0) / battery.capacity / batteries.length,
			0,
		);

		const value = Math.min(
			1,
			Math.max(0, (collectiveCharge - (1 / batteries.length) * index) * batteries.length),
		);

		if (barRef.current) {
			barRef.current.style.height = `${value * 100}%`;
		}
		if (textRef.current) {
			textRef.current.innerText = `${Math.round(value * 100)}%`;
		}
	}, cardLoaded);
	return (
		<div className="flex h-full w-full flex-col">
			<div className="flex flex-auto flex-col justify-end">
				<div
					ref={barRef}
					className="striped-gradient rounded-xl border-2 border-green-900 bg-green-500"
					style={{
						height: `0%`,
					}}
				/>
			</div>
			<p className="text-center tabular-nums" ref={textRef}>
				0%
			</p>
		</div>
	);
}
