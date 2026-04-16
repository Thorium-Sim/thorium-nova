import {
	CoreShortRangeHailerEvent,
	CoreShortRangePickHailerEvent,
	CoreShortRangePickTargetEvent,
	CoreShortRangeTargetEvent,
} from "@thorium/cards/ShortRangeComm/events";
import { q } from "@thorium/context/AppContext";
import useEventListener from "@thorium/hooks/useEventListener";
import { useStation } from "@thorium/routes/station/useStation";
import Button from "@thorium/ui/Button";
import { OutputField } from "@thorium/ui/Core";
import { cn } from "@thorium/utils/cn";
import { startTransition, Suspense, useState } from "react";

export function ShortRangeCommCore() {
	const { shipId } = useStation();
	const [hailerId, setHailerId] = useState<number>();
	const [targetId, setTargetId] = useState<number>();

	useEventListener<CoreShortRangeHailerEvent>(
		CoreShortRangeHailerEvent.name,
		(event) => {
			startTransition(() => {
				setHailerId(event.hailerId);
			});
		},
	);
	useEventListener<CoreShortRangeTargetEvent>(
		CoreShortRangeTargetEvent.name,
		(event) => {
			startTransition(() => {
				setTargetId(event.targetId);
			});
		},
	);

	return (
		<div className="text-sm h-full">
			<Suspense>
				<HailerInput
					targetId={targetId}
					hailerId={hailerId}
					setHailerId={setHailerId}
				/>
			</Suspense>
			<Suspense>
				<TargetInput
					targetId={targetId}
					hailerId={hailerId}
					setTargetId={setTargetId}
				/>
			</Suspense>
		</div>
	);
}

function HailerInput({
	targetId,
	hailerId,
	setHailerId,
}: {
	targetId: number | undefined;
	hailerId: number | undefined;
	setHailerId: (id: number | undefined) => void;
}) {
	const { shipId } = useStation();

	const [hailerObject] = q.starmapCore.object.useNetRequest({
		objectId: hailerId,
	});

	return (
		<>
			<p className="text-xs">Hail From</p>
			<div className="flex">
				<OutputField className="flex-auto">
					{hailerId
						? hailerObject?.components.identity?.name || `Entity ID ${hailerId}`
						: ""}
				</OutputField>
				<Button
					className={cn("btn-xs btn-info", {
						"rounded-r-none": targetId !== shipId,
					})}
					onClick={() => {
						window.dispatchEvent(new CoreShortRangePickHailerEvent());
					}}
				>
					Pick from Starmap
				</Button>
				{targetId !== shipId && (
					<Button
						className="btn-xs btn-success rounded-l-none"
						onClick={() => setHailerId(shipId)}
					>
						Player Ship
					</Button>
				)}
			</div>
		</>
	);
}
function TargetInput({
	targetId,
	hailerId,
	setTargetId,
}: {
	targetId: number | undefined;
	hailerId: number | undefined;
	setTargetId: (id: number | undefined) => void;
}) {
	const { shipId } = useStation();

	const [targetObject] = q.starmapCore.object.useNetRequest({
		objectId: targetId,
	});

	return (
		<>
			<p className="text-xs">Hail To</p>
			<div className="flex">
				<OutputField className="flex-auto">
					{targetId
						? targetObject?.components.identity?.name || `Entity ID ${targetId}`
						: ""}
				</OutputField>
				<Button
					className={cn("btn-xs btn-info", {
						"rounded-r-none": hailerId !== shipId,
					})}
					onClick={() => {
						window.dispatchEvent(new CoreShortRangePickTargetEvent());
					}}
				>
					Pick from Starmap
				</Button>
				{hailerId !== shipId && (
					<Button
						className="btn-xs btn-success rounded-l-none"
						onClick={() => setTargetId(shipId)}
					>
						Player Ship
					</Button>
				)}
			</div>
		</>
	);
}
