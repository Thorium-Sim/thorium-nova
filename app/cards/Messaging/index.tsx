import { useConversations } from "@thorium/cards/Messaging/core";
import { q } from "@thorium/context/AppContext";
import { useStation } from "@thorium/routes/station/useStation";
import Button from "@thorium/ui/Button";
import { Icon } from "@thorium/ui/Icon";
import Input from "@thorium/ui/Input";
import Select from "@thorium/ui/Select";
import { cn } from "@thorium/utils/cn";
import { useEffect, useRef, useState } from "react";
import "./messaging.css";
import { fromDate } from "dot-beat-time";

export function Messaging() {
	const { station, shipId } = useStation();
	const messageGroups = station.messageGroups;
	const conversations = useConversations(station.name);
	const [selectedConversationDestination, setSelectedConversationDestination] =
		useState<string | null>(null);

	const selectedConversation = conversations.find(
		(c) => c.sender === selectedConversationDestination,
	);
	const [ship] = q.ship.get.useNetRequest({ shipId });

	const stations =
		ship?.components.stationComplement?.stations.map((s) => s.name) || [];

	// Group messages by participant and timestamps 5 minutes or more apart
	const groupedMessages: {
		sender: string;
		timestamp: number;
		isStation: boolean;
		messages: string[];
	}[] = [];
	for (let i = 0; i < (selectedConversation?.messages.length || 0); i++) {
		const message = selectedConversation?.messages[i];
		if (!message) continue;
		const isStation = message.sender === station.name;
		const lastGrouped = groupedMessages[groupedMessages.length - 1];
		if (
			(lastGrouped?.isStation === isStation &&
				lastGrouped?.sender === message.sender) ||
			(lastGrouped?.isStation &&
				isStation &&
				message.timestamp - (lastGrouped.timestamp || 0) < 5 * 60 * 1000)
		) {
			lastGrouped.messages.push(message.content);
			lastGrouped.timestamp = message.timestamp;
		} else {
			groupedMessages.push({
				sender: message.sender,
				timestamp: message.timestamp,
				messages: [message.content],
				isStation,
			});
		}
	}

	const scrollRef = useRef<HTMLDivElement>(null);
	useEffect(() => {
		if (selectedConversation) {
			scrollRef.current?.scrollTo({
				// behavior: "smooth",
				top: scrollRef.current.scrollHeight,
			});
		}
	}, [selectedConversation]);
	return (
		<div className="grid grid-cols-3 gap-4 h-screen max-h-full min-h-64 flex-auto">
			<div className="flex flex-col gap-1">
				<p>Conversations</p>
				<ul className="list-group flex-1 panel">
					{conversations.map((c) => (
						<li
							key={`${c.recipient}-${c.sender}`}
							className={cn("list-group-item list-group-item-small", {
								selected: selectedConversationDestination === c.sender,
							})}
							onClick={() => {
								setSelectedConversationDestination(c.sender);
							}}
						>
							{stations.includes(c.sender) && stations.includes(c.recipient) ? (
								<>
									{c.sender} <Icon name="arrow-left-right" /> {c.recipient}
								</>
							) : (
								c.sender
							)}
						</li>
					))}
				</ul>
				<Select
					label="Start Conversation"
					labelHidden
					className="w-full"
					placeholder="New Conversation"
					items={[
						{
							header: "Stations",
							items: stations
								.filter((s) => s !== station.name)
								.map((s) => ({ id: s, label: s })),
						},
						...(messageGroups.length > 0
							? [
									{
										header: "Message Groups",
										items: messageGroups.map((m) => ({ id: m, label: m })),
									},
								]
							: []),
					]}
					selected={null}
					setSelected={(value) => setSelectedConversationDestination(value)}
				/>
			</div>
			<div className="flex flex-col col-span-2 min-h-0">
				<div
					className="flex-auto flex flex-col overflow-y-auto overflow-x-hidden pr-2"
					ref={scrollRef}
				>
					{!selectedConversationDestination ? null : !selectedConversation ||
						selectedConversation.messages.length === 0 ? (
						<div className="self-center py-1 px-2 rounded-lg bg-gray-800 mb-4">
							Start of Conversation with {selectedConversationDestination}
						</div>
					) : (
						groupedMessages.map((group) => (
							<div
								className={cn("mt-2 max-w-[75%]", {
									"ml-auto": group.isStation,
								})}
								key={`group-${group.timestamp}`}
							>
								<div className="flex gap-1 items-end">
									<div
										className={cn("flex flex-col gap-px flex-auto", {
											"items-end": group.isStation,
										})}
									>
										{!group.isStation ? (
											<div
												className={cn(
													"text-xs block text-foreground/60 text-left",
												)}
											>
												{group.sender}
											</div>
										) : null}
										{group.messages.map((message, j) => (
											<Message
												key={`${group.timestamp}${j}`}
												message={message}
												isStation={group.isStation}
											/>
										))}
										<time
											className={cn(
												"text-xs block text-foreground/60 col-span-2",
												{
													"text-right": group.isStation,
													"text-left col-span-2": !group.isStation,
												},
											)}
										>
											{fromDate(new Date(group.timestamp), true)}
										</time>
									</div>
								</div>
							</div>
						))
					)}
				</div>
				<form
					className="flex"
					onSubmit={(event) => {
						event.preventDefault();
						const content = event.currentTarget.message.value;
						if (!selectedConversationDestination) return;

						if (!content.trim()) return;

						q.messaging.sendInternalMessage.netSend({
							shipId,
							content,
							destination: selectedConversationDestination,
							sender: station.name,
						});
						event.currentTarget.message.value = "";
					}}
				>
					<Input
						disabled={!selectedConversationDestination}
						className="flex-1"
						label="Message Input"
						labelHidden
						name="message"
					/>
					<Button
						className="btn-sm"
						disabled={!selectedConversationDestination}
						type="submit"
					>
						Send Message
					</Button>
				</form>
			</div>
		</div>
	);
}

function Message({
	message,
	isStation,
}: {
	message: string;
	isStation: boolean;
}) {
	return (
		<div
			className={cn(
				"message w-fit rounded-[1rem] px-3 py-2 text-sm relative overflow-visible whitespace-pre-wrap break-words",
				"after:hidden last-of-type:after:block after:absolute after:bottom-0 after:right-0 after:w-3 after:h-4",
				{
					"bg-gray-600 after:bg-gray-600 after:left-0": !isStation,
					"station bg-primary text-primary-foreground after:bg-primary after:right-0":
						isStation,
				},
			)}
			// biome-ignore lint/security/noDangerouslySetInnerHtml: <explanation>
			dangerouslySetInnerHTML={{ __html: message }}
		/>
	);
}
