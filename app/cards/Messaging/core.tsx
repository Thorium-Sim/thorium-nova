import { q } from "@thorium/context/AppContext";
import { useStation } from "@thorium/routes/station/useStation";
import Button from "@thorium/ui/Button";
import { InputField } from "@thorium/ui/Core";
import { Icon } from "@thorium/ui/Icon";
import Input from "@thorium/ui/Input";
import Select from "@thorium/ui/Select";
import { cn } from "@thorium/utils/cn";
import { useMemo, useState } from "react";

type Conversation = {
	sender: string;
	recipient: string;
	lastTimestamp: number;
	messages: { content: string; sender: string; timestamp: number }[];
};
export function MessagingCore() {
	const { shipId } = useStation();
	const [messageGroups] = q.messaging.messageGroups.useNetRequest({ shipId });
	const [ship] = q.ship.get.useNetRequest({ shipId });
	const [selectedConversationDestination, setSelectedConversationDestination] =
		useState<string | null>(null);
	const [sender, setSender] = useState("");
	const [alertSender, setAlertSender] = useState(false);

	const stations =
		ship?.components.stationComplement?.stations.map((s) => s.name) || [];

	const conversations = useConversations();

	const selectedConversation = conversations.find(
		(c) => c.recipient === selectedConversationDestination,
	);

	return (
		<div className="grid grid-cols-3 text-sm h-full">
			<div className="flex flex-col">
				<ul className="list-group flex-1">
					{conversations.map((c) => (
						<li
							key={`${c.recipient}-${c.sender}`}
							className={cn("list-group-item list-group-item-small", {
								selected: selectedConversationDestination === c.recipient,
							})}
							onClick={() => {
								setSelectedConversationDestination(c.recipient);
								setSender(c.sender);
							}}
						>
							{stations.includes(c.sender) && stations.includes(c.recipient) ? (
								<>
									{c.sender} <Icon name="arrow-left-right" /> {c.recipient}
								</>
							) : (
								c.recipient
							)}
						</li>
					))}
				</ul>
				<Select
					label="Start Conversation"
					labelHidden
					size="xs"
					className="w-full"
					placeholder="Start Conversation"
					items={[
						{
							header: "Stations",
							items: stations.map((s) => ({ id: s, label: s })),
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
			<div className="flex flex-col col-span-2">
				<div className="flex-auto flex flex-col justify-end">
					{!selectedConversationDestination ? null : !selectedConversation ||
						selectedConversation.messages.length === 0 ? (
						<div className="self-center py-1 px-2 rounded-lg bg-gray-800 mb-4">
							Start of Conversation with {selectedConversationDestination}
						</div>
					) : (
						selectedConversation.messages.map((m) => (
							<div
								key={m.timestamp}
								title={new Date(m.timestamp).toLocaleTimeString()}
							>
								<span className="font-bold">{m.sender}:</span> {m.content}
							</div>
						))
					)}
				</div>
				<div>
					<form
						className="flex"
						onSubmit={(event) => {
							event.preventDefault();
							const content = event.currentTarget.message.value;
							if (!selectedConversationDestination) return;
							if (!sender) {
								setAlertSender(true);
								setTimeout(() => {
									setAlertSender(false);
								}, 50);
								setTimeout(() => {
									setAlertSender(true);
								}, 100);
								setTimeout(() => {
									setAlertSender(false);
								}, 150);
								setTimeout(() => {
									setAlertSender(true);
								}, 200);
								setTimeout(() => {
									setAlertSender(false);
								}, 250);
								return;
							}
							if (!content.trim()) return;

							q.messaging.sendInternalMessage.netSend({
								shipId,
								content,
								destination: selectedConversationDestination,
								sender,
							});
							event.currentTarget.message.value = "";
						}}
					>
						<Input
							disabled={!selectedConversationDestination}
							className="input-xs flex-1"
							label="Message Input"
							labelHidden
							name="message"
						/>
						<Button
							disabled={!selectedConversationDestination}
							className="btn-xs"
							type="submit"
						>
							Send
						</Button>
					</form>
					<InputField
						prompt="What is the name of the sender?"
						promptValue={sender}
						alert={alertSender}
						onClick={(value) =>
							typeof value === "string" ? setSender(value) : null
						}
					>
						{sender || <>&nbsp;</>}
					</InputField>
				</div>
			</div>
		</div>
	);
}

export function useConversations(station?: string) {
	const { shipId } = useStation();
	const [messages] = q.messaging.messages.useNetRequest({ shipId, station });
	const [ship] = q.ship.get.useNetRequest({ shipId });

	const stations =
		ship?.components.stationComplement?.stations.map((s) => s.name) || [];

	const conversations = useMemo(() => {
		const conversations = new Map<string, Conversation>();
		for (const message of messages) {
			const key =
				stations.includes(message.sender) &&
				stations.includes(message.destination)
					? [message.sender, message.destination].sort().join("")
					: stations.includes(message.destination)
						? message.destination
						: message.sender;
			const conversation = conversations.get(key) || {
				sender: stations.includes(message.sender)
					? message.destination
					: message.sender,
				recipient: stations.includes(message.sender)
					? message.sender
					: message.destination,
				messages: [],
				lastTimestamp: 0,
			};

			conversation.messages.push({
				content: message.content,
				sender: message.sender,
				timestamp: message.timestamp,
			});
			conversation.lastTimestamp = Math.max(
				conversation.lastTimestamp,
				message.timestamp,
			);
			conversation.sender = stations.includes(message.sender)
				? message.destination
				: message.sender;

			conversations.set(key, conversation);
		}

		const sortedConversations: Conversation[] = [];
		for (const conversation of conversations.values()) {
			sortedConversations.push(conversation);
		}
		sortedConversations.sort((a, b) => a.lastTimestamp - b.lastTimestamp);

		return sortedConversations;
	}, [messages, stations]);

	return conversations;
}
