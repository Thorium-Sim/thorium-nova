import { Activity, useState } from "react";
import { ComposePage } from "./ComposePage";
import { InboxPage } from "./InboxPage";
import type { Pages } from "./longRangeCommPages";
import { OutboxPage } from "./OutboxPage";
import { SentPage } from "./SentPage";
import { Sidebar } from "./Sidebar";

export function LongRangeComm() {
	const [currentPage, setCurrentPage] = useState<Pages>("inbox");

	return (
		<div className="flex gap-4 h-full">
			<Sidebar currentPage={currentPage} setCurrentPage={setCurrentPage} />
			<Activity mode={currentPage === "inbox" ? "visible" : "hidden"}>
				<InboxPage />
			</Activity>
			<Activity mode={currentPage === "compose" ? "visible" : "hidden"}>
				<ComposePage />
			</Activity>
			<Activity mode={currentPage === "sent" ? "visible" : "hidden"}>
				<SentPage />
			</Activity>
			<div
				className={
					currentPage === "outbox"
						? "h-full w-full"
						: "sr-only pointer-events-none"
				}
			>
				<OutboxPage pageLoaded={currentPage === "outbox"} />
			</div>
		</div>
	);
}
