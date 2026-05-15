import { clientId, q } from "@thorium/context/AppContext";
import { toast } from "@thorium/context/ToastContext";
import Button from "@thorium/ui/Button";
import { fromDate } from "dot-beat-time";
import * as React from "react";

export default function OfficersLog() {
	const [client] = q.client.get.useNetRequest({ clientId });
	const [officersLog] = q.officersLog.get.useNetRequest({ clientId });

	const [stardate, setStardate] = React.useState(new Date());
	const [logEntry, setLogEntry] = React.useState<string>("");
	const [selectedEntry, setSelectedEntry] = React.useState<number | null>();
	const textRef = React.useRef<HTMLTextAreaElement>(null);
	const entry = officersLog.find((e) => e.timestamp === selectedEntry);
	return (
		<div className="mx-auto grid h-screen max-h-[calc(22rem)] w-full max-w-5xl grid-cols-3 grid-rows-[2.5rem_1fr_auto] gap-4 @2xl:max-h-full @2xl:gap-8 @2xl:py-4">
			<h2 className="col-start-1 h-10 text-2xl font-bold @2xl:text-4xl">Officers Log</h2>
			<ul className="panel panel-alert col-start-1 overflow-y-auto">
				{officersLog
					.concat()
					.reverse()
					.map((log, i) => (
						<li
							key={`${log.timestamp}-${i}`}
							className={`list-group-item ${selectedEntry === log.timestamp ? "selected" : ""}`}
							onClick={() => setSelectedEntry(log.timestamp)}
						>
							{fromDate(new Date(log.timestamp), true)}
						</li>
					))}
			</ul>
			<Button
				className="btn-info @2xl:btn-md btn-sm col-start-1"
				onClick={() => {
					setSelectedEntry(null);
					setStardate(new Date());
					textRef.current?.focus();
				}}
			>
				New Log Entry
			</Button>
			<h3 className="col-span-2 col-start-2 row-start-1 flex h-10 items-end justify-between text-lg font-bold @2xl:text-2xl">
				<span>Log of Officer: {client.loginName}</span>
				<span>
					Stardate: {fromDate(entry?.timestamp ? new Date(entry?.timestamp) : stardate, true)}
				</span>
			</h3>
			<textarea
				ref={textRef}
				className="textarea textarea-alert col-span-2 col-start-2 row-start-2 p-2 text-xl @2xl:p-4"
				onChange={(e) => setLogEntry(e.target.value)}
				readOnly={!!entry}
				value={entry?.message || logEntry}
			/>
			<div className="col-span-2 col-start-2 row-start-3 flex gap-4 @2xl:gap-8">
				<Button
					className="btn-error @2xl:btn-md btn-sm flex-1"
					onClick={() => {
						setSelectedEntry(null);
						setLogEntry("");
						textRef.current?.focus();
					}}
				>
					Clear
				</Button>
				<Button
					className="btn-success @2xl:btn-md btn-sm flex-1"
					disabled={!!entry}
					onClick={async () => {
						if (logEntry.trim().length === 0) {
							toast({
								title: "Error creating officers log entry",
								body: "Please enter a log message.",
								color: "error",
							});
							return;
						}
						await q.officersLog.add.netSend({
							clientId,
							message: logEntry,
							timestamp: stardate.getTime(),
						});
						setLogEntry("");
						setStardate(new Date());
						setSelectedEntry(stardate.getTime());
					}}
				>
					Save
				</Button>
			</div>
		</div>
	);
}
