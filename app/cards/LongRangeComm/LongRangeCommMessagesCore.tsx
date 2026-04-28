import { keepPreviousData } from "@tanstack/react-query";
import { lrmStateMap } from "@thorium/cards/LongRangeComm/shared";
import { q } from "@thorium/context/AppContext";
import { SelectStarmapEntityEvent } from "@thorium/cores/StarmapCore";
import { pickStarmapShip } from "@thorium/cores/StarmapCore/pickShip";
import { useStation } from "@thorium/routes/station/useStation";
import Button from "@thorium/ui/Button";
import { InputField, OutputField, TypingField } from "@thorium/ui/Core";
import InfoTip from "@thorium/ui/InfoTip";
import Select from "@thorium/ui/Select";
import { cn } from "@thorium/utils/cn";
import { Suspense, startTransition, useState } from "react";

export function LongRangeCommMessagesCore() {
	const { shipId } = useStation();
	const [outgoingMessages] = q.longRangeComm.outgoingMessages.useNetRequest({
		shipId,
		filter: "all",
	});
	const [selectedMessageId, setSelectedMessageId] = useState<null | number>(null);
	const selectedMessage = outgoingMessages.find((o) => o.id === selectedMessageId);

	return (
		<div className="flex h-full flex-auto">
			<ul className="max-w-56 overflow-y-auto rounded border border-white/30">
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

			<div className="flex flex-auto flex-col text-sm">
				{selectedMessage && (
					<>
						<div>
							Sender:{" "}
							<OutputField className="ml-1 inline px-2">
								{selectedMessage.senderStation}
							</OutputField>
						</div>
						<div>
							State:
							<OutputField className="ml-1 inline px-2">
								{lrmStateMap[selectedMessage.state]}
							</OutputField>
						</div>
						<div>
							Destination:
							<OutputField className="ml-1 inline px-2">
								{selectedMessage.destinationShipName}
							</OutputField>
						</div>
						<div>Message:</div>
						<TypingField readOnly className="w-full flex-auto overflow-y-auto px-2 text-left">
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

	const [senderId, setSenderId] = useState<number>();
	const [senderStation, setSenderStation] = useState("");
	const [addressBookName, setAddressBookName] = useState("");
	const [destinationId, setDestinationId] = useState<number>();
	const [message, setMessage] = useState("");
	const [encoding, setEncoding] = useState<"decoded" | "waves" | "replacement" | "rotation">(
		"decoded",
	);

	return (
		<div className="flex h-full flex-col text-sm">
			<Suspense>
				<SenderInput
					destinationId={destinationId}
					senderId={senderId}
					setSenderId={setSenderId}
					addressBookName={addressBookName}
					setAddressBookName={setAddressBookName}
				/>
			</Suspense>
			{senderId === shipId && (
				<>
					<p className="text-xs">Sender Station</p>
					<InputField
						className="text-xs"
						onClick={(val) => setSenderStation(val)}
						prompt="Which station or person on the ship is sending the message out?"
					>
						{senderStation}
					</InputField>
				</>
			)}

			<Suspense>
				<DestinationInput
					destinationId={destinationId}
					setDestinationId={setDestinationId}
					senderId={senderId}
				/>
			</Suspense>

			<TypingField
				className="w-full flex-auto px-2 text-left text-sm"
				value={message}
				onChange={(e) => setMessage(e.currentTarget.value)}
			/>
			<div className="flex flex-wrap items-center gap-1">
				<Button
					className="btn-xs btn-error flex-auto"
					onClick={() => {
						setSenderId(undefined);
						setDestinationId(undefined);
						setSenderStation("");
						setAddressBookName("");
						setMessage("");
					}}
				>
					Clear
				</Button>{" "}
				<Select
					items={[
						{ id: "decoded", label: "Decoded" },
						{ id: "waves", label: "Waves" },
						{ id: "replacement", label: "Replacement" },
						{ id: "rotation", label: "Rotation" },
					]}
					label="Encoding"
					labelHidden
					size="xs"
					selected={encoding}
					setSelected={(value) => setEncoding(value || "decoded")}
				/>
				<Button
					className="btn-xs btn-info flex-auto"
					disabled={
						(senderId === shipId && !senderStation) ||
						!destinationId ||
						!senderId ||
						!message.trim()
					}
					onClick={() => {
						if ((senderId === shipId && !senderStation) || !destinationId || !senderId || !message)
							return;
						q.longRangeComm.composeMessage.netSend({
							senderId,
							destinationId,
							message,
							senderStation,
							state: "pending",
							encoding,
						});
						setSenderId(undefined);
						setDestinationId(undefined);
						setSenderStation("");
						setAddressBookName("");
						setMessage("");
					}}
				>
					Queue
				</Button>
				<Button
					className="btn-xs btn-success flex-auto"
					disabled={
						(senderId === shipId && !senderStation) ||
						!destinationId ||
						!senderId ||
						!message.trim()
					}
					onClick={() => {
						if ((senderId === shipId && !senderStation) || !destinationId || !senderId || !message)
							return;
						q.longRangeComm.composeMessage.netSend({
							senderId,
							destinationId,
							message,
							senderStation,
							state: "sending",
							encoding,
						});
						setSenderId(undefined);
						setDestinationId(undefined);
						setSenderStation("");
						setAddressBookName("");
						setMessage("");
					}}
				>
					Send Now
				</Button>
			</div>
		</div>
	);
}

function SenderInput({
	destinationId,
	senderId,
	setSenderId,
	addressBookName,
	setAddressBookName,
}: {
	destinationId: number | undefined;
	senderId: number | undefined;
	setSenderId: (value: number) => void;
	addressBookName: string;
	setAddressBookName: (value: string) => void;
}) {
	const { shipId } = useStation();

	const [addressBook] = q.longRangeComm.addressBook.useNetRequest(
		{
			shipId: destinationId || shipId,
		},
		{
			placeholderData: keepPreviousData,
		},
	);
	const [senderObject] = q.starmapCore.object.useNetRequest({
		objectId: senderId,
	});
	const addressBookEntry = addressBook.find((a) => a.id === senderId);

	const isNewAddressBookEntry =
		!!senderId && !addressBookEntry && senderId !== shipId && destinationId === shipId;

	return (
		<>
			<p className="text-xs">Sender</p>
			<div className="flex">
				{/* TODO March 10, 2026 - This should support both picking from the starmap AND searching through the ship's address book */}
				<OutputField
					className="flex-auto"
					alert={isNewAddressBookEntry}
					title={isNewAddressBookEntry ? "Sender will be added to the ship's address book" : ""}
				>
					{senderId
						? addressBookEntry?.name ||
							senderObject?.components.identity?.name ||
							`Entity ID ${senderId}`
						: ""}
					{senderId && addressBookEntry?.name
						? ` (${senderObject?.components.identity?.name})`
						: ""}
				</OutputField>
				<Button
					className={cn("btn-xs btn-info", {
						"rounded-r-none": destinationId !== shipId,
					})}
					onClick={() => {
						pickStarmapShip("Choose a ship to send the long range message.", (senderId) => {
							startTransition(() => {
								setSenderId(senderId);
							});
						});
					}}
				>
					Pick from Starmap
				</Button>
				{destinationId !== shipId && (
					<Button className="btn-xs btn-success rounded-l-none" onClick={() => setSenderId(shipId)}>
						Player Ship
					</Button>
				)}
			</div>
			{isNewAddressBookEntry && (
				<>
					<p className="text-xs">
						Address Book Name{" "}
						<InfoTip>
							Name used for this sender when added to the ship's address book. Leave blank to use
							the sender's actual name.
						</InfoTip>
					</p>
					<InputField
						onClick={(val) => setAddressBookName(val)}
						prompt="What name should this sender have when added to the ship's address book?"
					>
						{addressBookName}
					</InputField>
				</>
			)}
		</>
	);
}
function DestinationInput({
	destinationId,
	setDestinationId,
	senderId,
}: {
	senderId: number | undefined;
	destinationId: number | undefined;
	setDestinationId: (value: number) => void;
}) {
	const { shipId } = useStation();

	const [destinationObject] = q.starmapCore.object.useNetRequest(
		{ objectId: destinationId },
		{ placeholderData: keepPreviousData },
	);

	const [addressBook] = q.longRangeComm.addressBook.useNetRequest(
		{
			shipId: senderId || shipId,
		},
		{
			placeholderData: keepPreviousData,
		},
	);
	const addressBookEntry = addressBook.find((a) => a.id === destinationId);

	return (
		<>
			<p className="text-xs">Destination</p>
			<div className="flex items-center">
				<OutputField className="flex-auto">
					{destinationId
						? addressBookEntry?.name ||
							destinationObject?.components.identity?.name ||
							`Entity ID ${senderId}`
						: ""}
				</OutputField>
				<Button
					className={cn("btn-xs btn-info", {
						"rounded-r-none": senderId !== shipId,
					})}
					onClick={() => {
						pickStarmapShip("Choose a ship to receive the long range message.", (destinationId) => {
							startTransition(() => {
								setDestinationId(destinationId);
							});
						});
					}}
				>
					Pick from Starmap
				</Button>
				{senderId !== shipId && (
					<Button
						className="btn-xs btn-success rounded-l-none"
						onClick={() => setDestinationId(shipId)}
					>
						Player Ship
					</Button>
				)}
			</div>
		</>
	);
}

export function LongRangeCommAddressBookCore() {
	const { shipId } = useStation();
	const [addressBook] = q.longRangeComm.addressBook.useNetRequest({ shipId });
	const [selectedContact, setSelectedContact] = useState<number | null>(null);
	return (
		<div className="flex h-full flex-col">
			<ul className="flex-auto overflow-y-auto rounded border border-white/30">
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
