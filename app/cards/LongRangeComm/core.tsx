import { lrmStateMap } from "@thorium/cards/LongRangeComm/events";
import { CoreComposeLongRangeMessageEvent } from "@thorium/cards/LongRangeComm/events";
import { q } from "@thorium/context/AppContext";
import { SelectStarmapEntityEvent } from "@thorium/cores/StarmapCore";
import useAnimationFrame from "@thorium/hooks/useAnimationFrame";
import useEventListener from "@thorium/hooks/useEventListener";
import useInterval from "@thorium/hooks/useInterval";
import { useStation } from "@thorium/routes/station/useStation";
import Button from "@thorium/ui/Button";
import { InputField, OutputField, TypingField } from "@thorium/ui/Core";
import InfoTip from "@thorium/ui/InfoTip";
import Input from "@thorium/ui/Input";
import SearchableInput, {
	DefaultResultLabel,
} from "@thorium/ui/SearchableInput";
import { cn } from "@thorium/utils/cn";
import { useEffect, useId, useState } from "react";

export function LongRangeCommMessagesCore() {
	const { shipId } = useStation();
	const [outgoingMessages] = q.longRangeComm.outgoingMessages.useNetRequest({
		shipId,
		filter: "all",
	});
	const [selectedMessageId, setSelectedMessageId] = useState<null | number>(
		null,
	);
	const selectedMessage = outgoingMessages.find(
		(o) => o.id === selectedMessageId,
	);

	return (
		<div className="flex flex-auto h-full">
			<ul className="max-w-56 overflow-y-auto border border-white/30 rounded">
				{outgoingMessages.map((message) => (
					<li
						key={message.id}
						className={cn("list-group-item list-group-item-xs", {
							selected: selectedMessageId === message.id,
						})}
						onClick={() => setSelectedMessageId(message.id)}
					>
						{message.destinationShipName}
						<small className="block">
							{new Date(message.timestamp).toLocaleTimeString([], {
								hour: "numeric",
								minute: "2-digit",
							})}
						</small>
					</li>
				))}
			</ul>

			<div className="text-sm flex-auto flex flex-col">
				{selectedMessage && (
					<>
						<div>
							Sender:{" "}
							<OutputField className="ml-1 px-2 inline">
								{selectedMessage.senderStation}
							</OutputField>
						</div>
						<div>
							State:
							<OutputField className="ml-1 px-2 inline">
								{lrmStateMap[selectedMessage.state]}
							</OutputField>
						</div>
						<div>
							Destination:
							<OutputField className="ml-1 px-2 inline">
								{selectedMessage.destinationShipName}
							</OutputField>
						</div>
						<div>Message:</div>
						<TypingField
							readOnly
							className="flex-auto w-full text-left px-2 overflow-y-auto"
						>
							{selectedMessage.message}
						</TypingField>
					</>
				)}
			</div>
		</div>
	);
}

export function LongRangeCommComposerCore() {
	const { shipId } = useStation();

	const [sender, setSender] = useState<number>();
	const [outgoingMessage, setOutgoingMessage] = useState("");
	const [incomingMessage, setIncomingMessage] = useState("");
	const [addressBookName, setAddressBookName] = useState("");
	const [sendingMode, setSendingMode] = useState<"outgoing" | "incoming">(
		"incoming",
	);

	const [senderStation, setSenderStation] = useState("");
	const [destinationId, setDestinationId] = useState<number | null>();

	const [addressBook] = q.longRangeComm.addressBook.useNetRequest({ shipId });
	const [senderObject] = q.starmapCore.object.useNetRequest(
		{ objectId: sender },
		{ enabled: !!sender },
	);

	useEventListener<CoreComposeLongRangeMessageEvent>(
		CoreComposeLongRangeMessageEvent.name,
		(event) => {
			setSender(event.senderId);
		},
	);

	const addressBookEntry = addressBook.find((a) => a.id === sender);

	return (
		<div className="flex flex-col text-sm h-full">
			<div className="flex gap-1">
				<Button
					className={cn("btn-xs", { "btn-active": sendingMode === "incoming" })}
					onClick={() => setSendingMode("incoming")}
				>
					Incoming
				</Button>
				<Button
					className={cn("btn-xs", { "btn-active": sendingMode === "outgoing" })}
					onClick={() => setSendingMode("outgoing")}
				>
					Outgoing
				</Button>
			</div>
			{sendingMode === "incoming" ? (
				<>
					<p className="text-xs">
						Sender <InfoTip>Use the Starmap core to select a sender</InfoTip>
					</p>
					<OutputField
						alert={!!sender && !addressBookEntry}
						title="Sender will be added to the ship's address book"
					>
						{sender
							? addressBookEntry?.name ||
								senderObject?.components.identity?.name ||
								`Entity ID ${sender}`
							: ""}
					</OutputField>
					{sender && !addressBookEntry ? (
						<>
							<p className="text-xs">
								Address Book Name{" "}
								<InfoTip>
									Name used for this sender when added to the ship's address
									book. Leave blank to use the sender's actual name.
								</InfoTip>
							</p>
							<InputField
								onClick={(val) => setAddressBookName(val)}
								prompt="What name should this sender have when added to the ship's address book?"
							>
								{addressBookName}
							</InputField>
						</>
					) : null}
				</>
			) : (
				<>
					<p className="text-xs">Sender</p>
					<InputField
						className="text-xs"
						onClick={(val) => setSenderStation(val)}
						prompt="Which station or person on the ship is sending the message out?"
					>
						{senderStation}
					</InputField>
					<p className="text-xs">Destination</p>
					<SearchableInput
						className="w-full"
						inputClassName="input-xs"
						queryKey="address-book"
						placeholder="Search Address Book"
						getOptions={async ({ queryKey, signal }) => {
							return addressBook;
						}}
						ResultLabel={({ active, result, selected }) => (
							<DefaultResultLabel active={active} selected={selected}>
								<p>{result.name || result.entityName}</p>
							</DefaultResultLabel>
						)}
						selected={addressBook.find((a) => a.id === destinationId) || null}
						setSelected={(value) => {
							if (!value) return;
							setDestinationId(value.id);
						}}
						displayValue={(item) => item?.name || ""}
					/>
				</>
			)}
			<TypingField
				className="w-full flex-auto text-sm text-left px-2"
				value={sendingMode === "incoming" ? incomingMessage : outgoingMessage}
				onChange={(e) =>
					sendingMode === "incoming"
						? setIncomingMessage(e.currentTarget.value)
						: setOutgoingMessage(e.currentTarget.value)
				}
			/>
			<div className="flex gap-1">
				<Button
					className="flex-auto btn-xs btn-error"
					onClick={() => {
						if (sendingMode === "outgoing") {
							setDestinationId(null);
							setSenderStation("");
						} else {
							setSender(undefined);
						}
						setOutgoingMessage("");
					}}
				>
					Clear
				</Button>
				{sendingMode === "outgoing" ? (
					<Button
						className="flex-auto btn-xs btn-success"
						disabled={
							!senderStation || !destinationId || !outgoingMessage.trim()
						}
						onClick={() => {
							if (!senderStation || !destinationId || !outgoingMessage) return;
							q.longRangeComm.composeMessage.netSend({
								senderId: shipId,
								destinationId,
								message: outgoingMessage,
								senderStation,
								state: "pending",
							});
							setDestinationId(null);
							setSenderStation("");
							setOutgoingMessage("");
						}}
					>
						Send
					</Button>
				) : (
					<div />
				)}
			</div>
		</div>
	);
}

export function LongRangeCommAddressBookCore() {
	const { shipId } = useStation();
	const [addressBook] = q.longRangeComm.addressBook.useNetRequest({ shipId });
	const [selectedContact, setSelectedContact] = useState<number | null>(null);
	return (
		<div className="flex flex-col h-full">
			<ul className="flex-auto overflow-y-auto border border-white/30 rounded">
				{addressBook.map((contact) => (
					<li
						key={contact.id}
						className={cn("list-group-item list-group-item-xs", {
							selected: selectedContact === contact.id,
						})}
						onClick={() => {
							setSelectedContact(contact.id);
							window.dispatchEvent(new SelectStarmapEntityEvent(contact.id));
						}}
					>
						{contact.name}
						{contact.name ? ` (${contact.entityName})` : contact.entityName}
					</li>
				))}
			</ul>
			{selectedContact ? (
				<Button
					className="btn-xs btn-error"
					onClick={() => {
						q.longRangeComm.removeFromAddressBook.netSend({
							shipId,
							contactId: selectedContact,
						});
						setSelectedContact(null);
					}}
				>
					Delete Contact
				</Button>
			) : null}
		</div>
	);
}
