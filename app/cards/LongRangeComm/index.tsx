import { q } from "@thorium/context/AppContext";
import { useStation } from "@thorium/routes/station/useStation";
import Button from "@thorium/ui/Button";
import { Icon } from "@thorium/ui/Icon";
import SearchableInput, {
	DefaultResultLabel,
} from "@thorium/ui/SearchableInput";
import Select from "@thorium/ui/Select";
import { Tooltip } from "@thorium/ui/Tooltip";
import { cn } from "@thorium/utils/cn";
import { useState } from "react";
import {
	ComboBox,
	Input,
	Label,
	ListBox,
	ListBoxItem,
	Popover,
	Button as RAButton,
	TextArea,
} from "react-aria-components";

type Pages = "inbox" | "archive" | "sent" | "compose";
export function LongRangeComm() {
	const { shipId } = useStation();
	const [incomingMessages] = q.longRangeComm.incomingMessages.useNetRequest({
		shipId,
	});
	const [outgoingMessages] = q.longRangeComm.outgoingMessages.useNetRequest({
		shipId,
	});
	const [currentPage, setCurrentPage] = useState<Pages>("compose");

	let page = <div />;
	switch (currentPage) {
		case "inbox":
			page = <InboxPage />;
			break;
		case "archive":
			page = <ArchivePage />;
			break;
		case "compose":
			page = <ComposePage />;
			break;
		case "sent":
			page = <SentPage />;
			break;
	}

	return (
		<div className="flex gap-4 h-full">
			<Sidebar currentPage={currentPage} setCurrentPage={setCurrentPage} />
			{page}
		</div>
	);
}

function Sidebar({
	currentPage,
	setCurrentPage,
}: {
	currentPage: Pages;
	setCurrentPage: (page: Pages) => void;
}) {
	return (
		<div className="flex flex-col items-center gap-4">
			<Tooltip content="Inbox" placement="right">
				<Button
					className={cn("btn-round btn-alert", {
						active: currentPage === "inbox",
					})}
					onClick={() => setCurrentPage("inbox")}
				>
					<Icon name="inbox" />
				</Button>
			</Tooltip>
			<Tooltip content="Sent" placement="right">
				<Button
					className={cn("btn-round btn-alert", {
						active: currentPage === "sent",
					})}
					onClick={() => setCurrentPage("sent")}
				>
					<Icon name="send" />
				</Button>
			</Tooltip>
			<Tooltip content="Archive" placement="right">
				<Button
					className={cn("btn-round btn-alert", {
						active: currentPage === "archive",
					})}
					onClick={() => setCurrentPage("archive")}
				>
					<Icon name="archive" />
				</Button>
			</Tooltip>
			<Tooltip content="Compose Message" placement="right">
				<Button
					className={cn("btn-round btn-alert", {
						active: currentPage === "compose",
					})}
					onClick={() => setCurrentPage("compose")}
				>
					<Icon name="pencil-line" />
				</Button>
			</Tooltip>
		</div>
	);
}

function InboxPage() {
	return <div></div>;
}
function ArchivePage() {
	return <div></div>;
}
function ComposePage() {
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
							<p>{result.name}</p>
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
				className="textarea resize-none flex-1"
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
				<Select
					className="flex-1"
					disabled={message.trim().length === 0 || contactId === -1}
					buttonClassName="btn-success btn"
					label="Queue Message"
					placeholder="Queue Message"
					labelHidden
					selected={null}
					setSelected={(value) => {
						if (!value) return;
						q.longRangeComm.composeMessage.netSend({
							senderId: shipId,
							senderStation: station.name,
							destinationId: contactId,
							message,
							encoding: value,
						});
					}}
					hideIcon
					items={[
						{
							header: "Select Message Encoding",
							items: [
								{
									id: "decoded",
									label: "No Encoding",
								},
								{
									id: "waves",
									label: "Marconi",
								},
								{
									id: "rotation",
									label: "Haartsen",
								},
								{
									id: "replacement",
									label: "Lamarr",
								},
							],
						},
					]}
				/>
			</div>
		</div>
	);
}
function SentPage() {
	return <div></div>;
}
