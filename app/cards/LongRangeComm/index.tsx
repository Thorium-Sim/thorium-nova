import { clientId, q } from "@thorium/context/AppContext";
import { Activity, useState } from "react";

import { ComposePage } from "./ComposePage";
import { InboxPage } from "./InboxPage";
import type { Pages } from "./longRangeCommPages";
import { OutboxPage } from "./OutboxPage";
import { SentPage } from "./SentPage";
import { Sidebar } from "./Sidebar";

export function LongRangeComm() {
	const [currentPage, setCurrentPage] = useState<Pages>("inbox");

	function setPage(page: Pages) {
		setCurrentPage(page);
		q.thorium.genericEvent.netSend({
			clientId,
			eventName: "longRangePageChange",
			properties: page,
		});
	}
	return (
		<div className="flex h-full gap-4">
			<Sidebar currentPage={currentPage} setCurrentPage={setPage} />
			<Activity mode={currentPage === "inbox" ? "visible" : "hidden"}>
				<InboxPage />
			</Activity>
			<Activity mode={currentPage === "compose" ? "visible" : "hidden"}>
				<ComposePage />
			</Activity>
			<Activity mode={currentPage === "sent" ? "visible" : "hidden"}>
				<SentPage />
			</Activity>
			<div className={currentPage === "outbox" ? "h-full w-full" : "pointer-events-none sr-only"}>
				<OutboxPage pageLoaded={currentPage === "outbox"} />
			</div>
		</div>
	);
}
