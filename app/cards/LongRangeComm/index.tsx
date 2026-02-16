import { q } from "@thorium/context/AppContext";
import { useStation } from "@thorium/routes/station/useStation";
import Button from "@thorium/ui/Button";
import { Icon } from "@thorium/ui/Icon";
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
		<div className="flex gap-4">
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
	const { shipId } = useStation();

	const [addressBook] = q.longRangeComm.addressBook.useNetRequest({ shipId });

	return (
		<div>
			<ComboBox>
				<div className="flex items-center gap-2">
					<Label>To:</Label>
					<div className="combobox-field">
						<Input className="react-aria-Input inset" />
						<RAButton>
							<Icon name="chevron-down" />
						</RAButton>
					</div>
				</div>
				<Popover className="combobox-popover">
					<ListBox>
						{addressBook.map((contact) => (
							<ListBoxItem key={contact.id}>{contact.name}</ListBoxItem>
						))}
					</ListBox>
				</Popover>
			</ComboBox>
		</div>
	);
}
function SentPage() {
	return <div></div>;
}
