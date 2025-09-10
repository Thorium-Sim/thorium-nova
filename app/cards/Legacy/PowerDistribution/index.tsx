import { useMutationState } from "@tanstack/react-query";
import { Batteries } from "@thorium/cards/Legacy/PowerDistribution/Batteries";
import { q } from "@thorium/context/AppContext";
import { useStation } from "@thorium/routes/station/useStation";
import { cn } from "@thorium/utils/cn";
import { useRef, useState, type PointerEvent } from "react";

export function LegacyPowerDistribution() {
	const { shipId } = useStation();
	const [systems] = q.legacy.powerDistribution.systems.useNetRequest({
		shipId,
	});
	const [reactors] = q.legacy.powerDistribution.reactors.useNetRequest({
		shipId,
	});

	const maxPower = Math.max(40, ...systems.flatMap((sys) => sys.powerLevels));
	const reactorPower = reactors.reduce(
		(prev, reactor) =>
			prev +
			Math.round(
				reactor.maxOutput * reactor.efficiency * (reactor.offline ? 0 : 1),
			),
		0,
	);
	const systemsPower = systems.reduce((acc, sys) => acc + sys.currentPower, 0);
	const pendingMutation = useMutationState({
		filters: {
			mutationKey: q.legacy.powerDistribution.setPower.getMutationKey(),
			status: "pending",
		},
	});
	return (
		<div className="grid grid-cols-5 h-full">
			<div className="grid grid-cols-[auto_auto_1fr] h-full gap-x-4 gap-y-0.5 col-span-3 select-none content-between overflow-y-auto">
				{systems.map((system) => (
					<SystemBar key={system.id} {...system} maxPower={maxPower} />
				))}
			</div>
			<div className="col-span-2 flex flex-col justify-around">
				<Batteries />
				<div>
					<p className="font-semibold text-2xl">
						Total Power Available: {reactorPower}
					</p>
					<p className="font-semibold text-2xl">
						Total Power Used:{" "}
						<span
							className={cn({
								"opacity-50": pendingMutation.length > 0,
							})}
						>
							{systemsPower}
						</span>
					</p>
					<p
						className={cn("font-semibold text-2xl", {
							"text-red-500": reactorPower - systemsPower < 0,
						})}
					>
						Remaining Power: {reactorPower - systemsPower}
					</p>
				</div>
			</div>
		</div>
	);
}

const GAP_PX = 0;
function SystemBar({
	id,
	name,
	powerLevels,
	currentPower,
	maxPower,
	offline,
}: {
	id: number;
	name: string;
	powerLevels: number[];
	currentPower: number;
	maxPower: number;
	offline: boolean;
}) {
	const containerRef = useRef<HTMLDivElement>(null);
	const [localPower, setLocalPower] = useState(currentPower);
	const [isMouseDown, setIsMouseDown] = useState(false);
	const updatePower = q.legacy.powerDistribution.setPower.useNetSend();
	const displayPower =
		updatePower.isPending || isMouseDown ? localPower : currentPower;

	function handlePointerDown(e: PointerEvent) {
		if (!containerRef.current) return 0;
		setIsMouseDown(true);
		const rect = containerRef.current.getBoundingClientRect();

		const x = e.clientX - rect.left;
		const barWidth = rect.width / (maxPower + 1) + GAP_PX;
		let storedBarIndex = Math.max(
			0,
			Math.min(maxPower, Math.floor(x / barWidth)),
		);
		setLocalPower(storedBarIndex);

		if (storedBarIndex !== currentPower) {
			updatePower.mutate({
				systemId: id,
				currentPower: storedBarIndex,
			});
		}

		const abortController = new AbortController();

		document.addEventListener(
			"pointermove",
			(event) => {
				const x = event.clientX - rect.left;
				const barWidth = rect.width / (maxPower + 1) + GAP_PX;
				const barIndex = Math.max(
					0,
					Math.min(maxPower, Math.floor(x / barWidth)),
				);
				if (barIndex === storedBarIndex) return;

				storedBarIndex = barIndex;
				setLocalPower(barIndex);

				updatePower.mutate({
					systemId: id,
					currentPower: barIndex,
				});
			},
			{ signal: abortController.signal },
		);

		document.addEventListener(
			"pointerup",
			() => {
				abortController.abort();
				setIsMouseDown(false);
			},
			{
				once: true,
			},
		);
	}

	return (
		<>
			<p
				className={cn("text-right", {
					"text-gray-500": displayPower < powerLevels[0],
					"text-red-500": offline,
				})}
			>
				{name}
			</p>
			<p className="w-[2ch] tabular-nums text-center">{displayPower}</p>
			<div className="flex gap-1" ref={containerRef}>
				<div
					className="bg-gray-400 border-2 border-gray-500 h-full flex-1 cursor-pointer"
					onPointerDown={handlePointerDown}
				/>
				{Array.from({ length: maxPower }).map((_, i) => (
					<div
						key={i}
						className={cn(
							"h-full bg-green-500 border-2 border-green-600 flex-1 relative cursor-pointer",
							{
								"after:h-[calc(100%+4px)] after:bg-yellow-400 after:w-1 after:block after:rounded after:right-0 after:top-0 after:absolute after:translate-x-1/2 after:-translate-y-[2px] cursor-pointer":
									powerLevels.includes(i + 1),
								"bg-transparent border-transparent cursor-default":
									displayPower <= i,
							},
						)}
						onPointerDown={handlePointerDown}
					/>
				))}
			</div>
		</>
	);
}
