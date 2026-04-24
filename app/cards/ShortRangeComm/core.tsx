import { q } from "@thorium/context/AppContext";
import { pickStarmapShip } from "@thorium/cores/StarmapCore/pickShip";
import useEventListener from "@thorium/hooks/useEventListener";
import { useLocalStorage } from "@thorium/hooks/useLocalStorage";
import { useStation } from "@thorium/routes/station/useStation";
import Button from "@thorium/ui/Button";
import Checkbox from "@thorium/ui/Checkbox";
import { InputField, OutputField } from "@thorium/ui/Core";
import InfoTip from "@thorium/ui/InfoTip";
import Select from "@thorium/ui/Select";
import { Suspense, useState } from "react";
import { shortRangeStateMap } from "./shared";
import { keepPreviousData } from "@tanstack/react-query";
import { cn } from "@thorium/utils/cn";
export function ShortRangeCommCore() {
	const { shipId } = useStation();
	const [shortRangeComm] = q.shortRangeComm.get.useNetRequest({ shipId });
	const [{ allowOtherParticipants }, setAllowOtherParticipants] =
		useLocalStorage("core-short-range-allow-other-participants", {
			allowOtherParticipants: false,
		});

	if (!shortRangeComm)
		return <div className="text-sm">No Short Range Comm</div>;
	return (
		<div className="text-sm h-full">
			<div className="flex">
				<OutputField className="flex-1" alert={shortRangeComm.state !== "idle"}>
					{shortRangeStateMap[shortRangeComm.state]}
					<Suspense>
						<ConversationName conversationId={shortRangeComm.conversationId} />
					</Suspense>
				</OutputField>
				<InputField
					className="px-2 tabular-nums"
					prompt={
						<>
							What would you like to set the frequency to?
							<br />
							100 - 350
						</>
					}
					onClick={(value) => {
						if (Number.isNaN(Number(value))) return;
						q.shortRangeComm.setFrequency.netSend({
							shipId,
							frequency: Math.min(350, Math.max(100, Number(value))),
						});
					}}
					promptValue={shortRangeComm.frequency}
				>
					{shortRangeComm.frequency.toFixed(2)} MHz
				</InputField>
			</div>

			<Suspense>
				<ConversationSelect />
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
			{shortRangeComm.state === "idle" ? (
				<Button
					className="btn-xs btn-info w-full"
					onClick={() => {
						pickStarmapShip("Pick a ship to hail.", (targetId) => {
							if (!targetId || targetId === shipId) return;
							q.shortRangeComm.hail.netSend({
								shipId,
								targetId,
								allowOtherParticipants,
								conversationTemplateId: shortRangeComm.templateConversationId,
							});
						});
					}}
				>
					Hail...
				</Button>
			) : shortRangeComm.state === "hailing" &&
				shortRangeComm.conversationId ? (
				<Suspense>
					<HailingButtons conversationId={shortRangeComm.conversationId} />
				</Suspense>
			) : (
				<Button
					className="btn-xs btn-error w-full"
					onClick={() => q.shortRangeComm.disconnect.netSend({ shipId })}
				>
					Disconnect
				</Button>
			)}
			<IncomingHails />
		</div>
	);
}

function ConversationName({
	conversationId,
}: {
	conversationId: number | null | undefined;
}) {
	const { shipId } = useStation();
	const [conversation] = q.shortRangeComm.conversation.useNetRequest(
		{ conversationId },
		{ placeholderData: keepPreviousData },
	);

	return (
		<>
			{conversation
				? `: ${conversation.participants
						.filter((p) => p.id !== shipId)
						.map((p) => p.name)
						.join(", ")}`
				: ""}
		</>
	);
}

function HailingButtons({ conversationId }: { conversationId: number }) {
	const { shipId } = useStation();

	const [conversation] = q.shortRangeComm.conversation.useNetRequest({
		conversationId,
	});

	return (
		<div className="flex">
			<Button
				className={cn("btn-xs btn-warning flex-auto", {
					"rounded-r-none": conversation?.targetId,
				})}
				onClick={() => q.shortRangeComm.disconnect.netSend({ shipId })}
			>
				Cancel
			</Button>
			{conversation?.targetId ? (
				<>
					<Button
						className="btn-xs btn-error flex-auto rounded-none"
						onClick={() => {
							q.shortRangeComm.reject.netSend({
								conversationId,
							});
						}}
					>
						Reject
					</Button>
					<Button
						className="btn-xs btn-success flex-auto rounded-l-none"
						onClick={() => {
							q.shortRangeComm.connect.netSend({
								conversationId,
								shipId: conversation.targetId,
							});
						}}
					>
						Connect
					</Button>
				</>
			) : null}
		</div>
	);
}

function ConversationSelect() {
	const { shipId } = useStation();
	const [conversationTemplates] =
		q.conversation.conversationTemplates.useNetRequest();
	const [shortRangeComm] = q.shortRangeComm.get.useNetRequest({ shipId });

	return (
		<Select
			size="xs"
			items={conversationTemplates
				.map((c) => ({ id: c.id, label: c.name }))
				.concat({ id: null as any, label: "None" })}
			label="Conversation Template"
			selected={shortRangeComm?.templateConversationId || null}
			setSelected={(value) =>
				q.shortRangeComm.setTemplateConversation.netSend({
					shipId,
					templateConversationId: typeof value === "string" ? null : value,
				})
			}
		/>
	);
}

function IncomingHails() {
	const { shipId } = useStation();
	const [incomingHails] =
		q.shortRangeComm.incomingHailConversations.useNetRequest({ shipId });

	if (incomingHails.length === 0) return null;
	return (
		<div>
			<p>Incoming Hails</p>
			{incomingHails.map((c) => (
				<div className="flex" key={c.id}>
					<span className="flex-auto">
						{c.hostName} ({c.frequency}MHz){" "}
					</span>
					<Button
						className="btn-xs btn-error rounded-r-none"
						onClick={() =>
							q.shortRangeComm.reject.netSend({ conversationId: c.id, shipId })
						}
					>
						Reject
					</Button>
					<Button
						className="btn-xs btn-success rounded-l-none"
						onClick={() =>
							q.shortRangeComm.connect.netSend({ conversationId: c.id, shipId })
						}
					>
						Connect
					</Button>
				</div>
			))}
		</div>
	);
}
