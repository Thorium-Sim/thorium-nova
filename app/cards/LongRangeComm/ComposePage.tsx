import { q } from "@thorium/context/AppContext";
import { useStation } from "@thorium/routes/station/useStation";
import Button from "@thorium/ui/Button";
import SearchableInput, {
	DefaultResultLabel,
} from "@thorium/ui/SearchableInput";
import { useState } from "react";
import { Label, TextArea } from "react-aria-components";

export function ComposePage() {
	const { shipId, station } = useStation();

	const [addressBook] = q.longRangeComm.addressBook.useNetRequest({ shipId });
	const [contactId, setContactId] = useState(-1);
	const [message, setMessage] = useState("");
	return (
		<div className="w-full max-w-xl mx-auto flex flex-col">
			<div className="w-full flex items-center gap-2">
				<Label className="text-xl">To:</Label>
				<SearchableInput
					className="w-full"
					inputClassName="input-lg"
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
					selected={addressBook.find((a) => a.id === contactId) || null}
					setSelected={(value) => {
						if (!value) return;
						setContactId(value.id);
					}}
					displayValue={(item) => item?.name || ""}
				/>
			</div>

			<Label className="text-xl mt-4">Message:</Label>
			<TextArea
				className="textarea resize-none flex-1 w-full"
				value={message}
				onChange={(e) => setMessage(e.currentTarget.value)}
			/>
			<div className="flex gap-2 mt-4">
				<Button
					className="flex-1 btn-warning"
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
					className="flex-1 btn-success"
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
