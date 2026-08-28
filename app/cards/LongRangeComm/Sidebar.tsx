import { q } from "@thorium/context/AppContext";
import { useStation } from "@thorium/routes/station/useStation";
import Button from "@thorium/ui/Button";
import { Icon } from "@thorium/ui/Icon";
import { Tooltip } from "@thorium/ui/Tooltip";
import { cn } from "@thorium/utils/cn";

import type { Pages } from "./longRangeCommPages";

export function Sidebar({
	currentPage,
	setCurrentPage,
}: {
	currentPage: Pages;
	setCurrentPage: (page: Pages) => void;
}) {
	const { shipId } = useStation();

	const [pendingMessages] = q.longRangeComm.outgoingMessages.useNetRequest({
		shipId,
		filter: "pending",
	});
	const [encodedMessages] = q.longRangeComm.incomingMessages.useNetRequest({
		shipId,
	});

	const outboxLabel = pendingMessages.length;
	const inboxLabel = encodedMessages.filter((e) => e.unread).length;

	return (
		<div className="flex flex-col items-center gap-4">
			<Tooltip content="Inbox" placement="right">
				<Button
					className={cn("relative btn-round btn-alert inbox-button", {
						active: currentPage === "inbox",
					})}
					onClick={() => setCurrentPage("inbox")}
				>
					<span className="sr-only">Inbox</span>
					<Icon name="inbox" />
					{inboxLabel > 0 ? (
						<div className="badge badge-error absolute top-0 right-0 translate-x-1/2 -translate-y-1/2 rounded-full">
							{inboxLabel}
						</div>
					) : null}
				</Button>
			</Tooltip>
			<Tooltip content="Compose Message" placement="right">
				<Button
					className={cn("btn-round btn-alert compose-button", {
						active: currentPage === "compose",
					})}
					onClick={() => setCurrentPage("compose")}
				>
					<span className="sr-only">Compose Message</span>
					<Icon name="pencil-line" />
				</Button>
			</Tooltip>
			<Tooltip content="Outbox" placement="right">
				<Button
					className={cn("relative btn-round btn-alert outbox-button", {
						active: currentPage === "outbox",
					})}
					onClick={() => setCurrentPage("outbox")}
				>
					<span className="sr-only">Outbox</span>
					<Icon name="archive" />

					{outboxLabel > 0 ? (
						<div className="badge badge-error absolute top-0 right-0 translate-x-1/2 -translate-y-1/2 rounded-full">
							{outboxLabel}
						</div>
					) : null}
				</Button>
			</Tooltip>
			<Tooltip content="Sent" placement="right">
				<Button
					className={cn("btn-round btn-alert sent-button", {
						active: currentPage === "sent",
					})}
					onClick={() => setCurrentPage("sent")}
				>
					<span className="sr-only">Sent</span>
					<Icon name="send" />
				</Button>
			</Tooltip>
		</div>
	);
}
