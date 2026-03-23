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
					className={cn("relative btn-round btn-alert", {
						active: currentPage === "inbox",
					})}
					onClick={() => setCurrentPage("inbox")}
				>
					<Icon name="inbox" />
					{inboxLabel > 0 ? (
						<div className="absolute top-0 right-0 translate-x-1/2 -translate-y-1/2 badge badge-error rounded-full">
							{inboxLabel}
						</div>
					) : null}
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
			<Tooltip content="Outbox" placement="right">
				<Button
					className={cn("relative btn-round btn-alert", {
						active: currentPage === "outbox",
					})}
					onClick={() => setCurrentPage("outbox")}
				>
					<Icon name="archive" />

					{outboxLabel > 0 ? (
						<div className="absolute top-0 right-0 translate-x-1/2 -translate-y-1/2 badge badge-error rounded-full">
							{outboxLabel}
						</div>
					) : null}
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
		</div>
	);
}
