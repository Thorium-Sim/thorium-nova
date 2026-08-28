import { clientId, q } from "@thorium/context/AppContext";
import { useStation } from "@thorium/routes/station/useStation";
import Button from "@thorium/ui/Button";
import SearchableInput, { DefaultResultLabel } from "@thorium/ui/SearchableInput";
import { useState } from "react";
import { Label, TextArea } from "react-aria-components";

export function ComposePage() {
	const { shipId, station } = useStation();

	const [addressBook] = q.longRangeComm.addressBook.useNetRequest({ shipId });
	const [contactId, setContactId] = useState(-1);
	const [message, setMessage] = useState("");
	return (
		<div className="mx-auto flex w-full max-w-xl flex-col">
			<div className="address-book-entry flex w-full items-center gap-2">
				<Label className="text-xl">To:</Label>
				<SearchableInput
					className="w-full"
					inputClassName="input-lg"
					queryKey="address-book"
					placeholder="Search Address Book"
					getOptions={async () => {
						return addressBook;
					}}
					ResultLabel={({ active, result, selected }) => (
						<DefaultResultLabel active={active} selected={selected}>
							<p>{result.name || result.entityName}</p>
						</DefaultResultLabel>
					)}
					selected={addressBook.find((a) => a.id === contactId) || null}
					setSelected={(value) => {
						if (!value) return;
						setContactId(value.id);
						q.thorium.genericEvent.netSend({
							clientId,
							eventName: "longRangeComposerDestinationSet",
							properties: `${value.id}`,
						});
					}}
					displayValue={(item) => item?.name || item?.entityName || ""}
				/>
			</div>

			<Label className="mt-4 text-xl" htmlFor="compose-message-area">
				Message:
			</Label>
			<TextArea
				id="compose-message-area"
				className="textarea compose-message-area w-full flex-1 resize-none"
				value={message}
				onChange={(e) => setMessage(e.currentTarget.value)}
			/>
			<div className="mt-4 flex gap-2">
				<Button
					className="btn-warning flex-1"
					onClick={() => {
						setContactId(-1);
						setMessage("");
					}}
				>
					Clear
				</Button>
				{/* TODO February 18, 2026 - Make this work once we have the concept of files */}
				{/* <Button className="flex-1 btn-info">Attach...</Button> */}
				<Button
					className="btn-success queue-button flex-1"
					onClick={() => {
						q.longRangeComm.composeMessage.netSend({
							senderId: shipId,
							senderStation: station.name,
							destinationId: contactId,
							message,
						});
						setContactId(-1);
						setMessage("");
					}}
				>
					Queue Message
				</Button>
			</div>
		</div>
	);
}
