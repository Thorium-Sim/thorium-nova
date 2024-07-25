import * as React from "react";
import Button from "@thorium/ui/Button";
import { toast } from "@client/context/ToastContext";
import { fromDate } from "dot-beat-time";
import { q } from "@client/context/AppContext";

export default function OfficersLog() {
	const [client] = q.client.get.useNetRequest();
	const [officersLog] = q.officersLog.get.useNetRequest();

	const [stardate, setStardate] = React.useState(new Date());
	const [logEntry, setLogEntry] = React.useState<string>("");
	const [selectedEntry, setSelectedEntry] = React.useState<number | null>();
	const textRef = React.useRef<HTMLTextAreaElement>(null);
	const entry = officersLog.find((e) => e.timestamp === selectedEntry);
	return (
		<div className="mx-auto max-w-5xl w-full grid grid-cols-3 grid-rows-[2.5rem_1fr_auto] h-full @2xl:max-h-max max-h-[calc(22rem)] @2xl:py-4 @2xl:gap-8 gap-4">
			<h2 className="@2xl:text-4xl text-2xl font-bold h-10 col-start-1">
				Officers Log
			</h2>
			<ul className="panel panel-alert overflow-y-auto col-start-1">
				{officersLog
					.concat()
					.reverse()
					.map((log, i) => (
						// biome-ignore lint/a11y/useKeyWithClickEvents:
						<li
							key={`${log.timestamp}-${i}`}
							className={`list-group-item ${
								selectedEntry === log.timestamp ? "selected" : ""
							}`}
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
			<h3 className="@2xl:text-2xl text-lg font-bold h-10 flex justify-between items-end col-span-2 row-start-1 col-start-2">
				<span>Log of Officer: {client.loginName}</span>
				<span>
					Stardate:{" "}
					{fromDate(
						entry?.timestamp ? new Date(entry?.timestamp) : stardate,
						true,
					)}
				</span>
			</h3>
			<textarea
				ref={textRef}
				className="textarea textarea-alert text-xl col-span-2 row-start-2 col-start-2"
				onChange={(e) => setLogEntry(e.target.value)}
				readOnly={!!entry}
				value={entry?.message || logEntry}
			/>
			<div className="flex @2xl:gap-8 gap-4 col-span-2 col-start-2 row-start-3">
				<Button
					className="btn-error flex-1 @2xl:btn-md btn-sm"
					onClick={() => {
						setSelectedEntry(null);
						setLogEntry("");
						textRef.current?.focus();
					}}
				>
					Clear
				</Button>
				<Button
					className="btn-success flex-1 @2xl:btn-md btn-sm"
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
