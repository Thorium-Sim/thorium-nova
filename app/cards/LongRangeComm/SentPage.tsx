import { lrmStateMap } from "@thorium/cards/LongRangeComm/events";
import { q } from "@thorium/context/AppContext";
import { useStation } from "@thorium/routes/station/useStation";
import InfoTip from "@thorium/ui/InfoTip";
import { cn } from "@thorium/utils/cn";
import { useState } from "react";

export function SentPage() {
	const { shipId } = useStation();
	const [outgoingMessages] = q.longRangeComm.outgoingMessages.useNetRequest({
		filter: "sent",
		shipId,
	});
	const [selectedMessageId, setSelectedMessageId] = useState<number | null>(
		null,
	);
	const selectedMessage = outgoingMessages.find(
		(o) => o.id === selectedMessageId,
	);
	return (
		<div className="w-full h-full grid grid-cols-[16rem_1fr] gap-8">
			<div className="flex flex-col h-full">
				<h3>Sent Messages</h3>
				<ul className="panel flex-auto">
					{outgoingMessages.map((o) => (
						<li
							key={o.id}
							className={cn("list-group-item cursor-pointer", {
								selected: selectedMessageId === o.id,
							})}
							onClick={() => setSelectedMessageId(o.id)}
						>
							To: {o.destinationShipName}
							<small className="block">From: {o.senderStation}</small>
						</li>
					))}
				</ul>
			</div>
			{selectedMessage ? (
				<div className="grid gap-x-2 gap-y-4 grid-cols-[auto_1fr] grid-rows-[auto_auto_auto_1fr]">
					<p className="text-xl">To:</p>
					<p className="text-xl">{selectedMessage.destinationShipName}</p>
					<p className="text-xl">From:</p>
					<p className="text-xl">{selectedMessage.senderStation}</p>
					<p className="text-xl">State:</p>
					<p className="text-xl">
						{lrmStateMap[selectedMessage.state]}
						{selectedMessage.state === "undelivered" ? (
							<InfoTip>{selectedMessage.failureReason}</InfoTip>
						) : null}
					</p>
					<p className="col-span-2 panel p-4">{selectedMessage.message}</p>
				</div>
			) : null}
		</div>
	);
}
