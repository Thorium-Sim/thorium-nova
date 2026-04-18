import { q } from "@thorium/context/AppContext";
import { pickStarmapShip } from "@thorium/cores/StarmapCore/pickShip";
import useEventListener from "@thorium/hooks/useEventListener";
import { useLocalStorage } from "@thorium/hooks/useLocalStorage";
import { useStation } from "@thorium/routes/station/useStation";
import Button from "@thorium/ui/Button";
import Checkbox from "@thorium/ui/Checkbox";
import { OutputField } from "@thorium/ui/Core";
import InfoTip from "@thorium/ui/InfoTip";
import Select from "@thorium/ui/Select";
import { cn } from "@thorium/utils/cn";
import { startTransition, Suspense, useState } from "react";

export function ShortRangeCommCore() {
	const { shipId } = useStation();
	const [hailerId, setHailerId] = useState<number>();
	const [targetId, setTargetId] = useState<number>();
	const [conversationTemplateId, setConversationTemplateId] = useState<
		number | null
	>(null);
	const [{ allowOtherParticipants }, setAllowOtherParticipants] =
		useLocalStorage("core-short-range-allow-other-participants", {
			allowOtherParticipants: false,
		});

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
			<Suspense>
				<ConversationSelect
					selected={conversationTemplateId}
					setSelected={setConversationTemplateId}
				/>
			</Suspense>
			<Checkbox
				label={
					<>
						Allow Other Participants
						<InfoTip>
							Allow another participant to join the conversation after it is
							connected.
						</InfoTip>
					</>
				}
				checked={allowOtherParticipants}
				onChange={(event) =>
					setAllowOtherParticipants({
						allowOtherParticipants: event.currentTarget.checked,
					})
				}
			/>
			<Button
				className="btn-xs btn-info w-full"
				onClick={() => {
					if (!hailerId || !targetId) return;
					console.log(allowOtherParticipants);
					q.shortRangeComm.hail.netSend({
						shipId: hailerId,
						targetId: targetId,
						allowOtherParticipants,
						conversationTemplateId,
					});
				}}
				disabled={!hailerId || !targetId}
			>
				Hail
			</Button>
			<p>Active Hails</p>
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
						pickStarmapShip("Choose a ship to send the hail.", (hailerId) =>
							startTransition(() => {
								setHailerId(hailerId);
							}),
						);
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
						pickStarmapShip("Choose a ship to receive the hail.", (targetId) =>
							startTransition(() => {
								setTargetId(targetId);
							}),
						);
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

function ConversationSelect({
	selected,
	setSelected,
}: {
	selected: number | null;
	setSelected: (value: number | null) => void;
}) {
	const [conversationTemplates] =
		q.conversation.conversationTemplates.useNetRequest();

	return (
		<Select
			size="xs"
			items={conversationTemplates
				.map((c) => ({ id: c.id, label: c.name }))
				.concat({ id: null as any, label: "None" })}
			label="Conversation Template"
			selected={selected}
			setSelected={(value) => setSelected(value)}
		/>
	);
}
