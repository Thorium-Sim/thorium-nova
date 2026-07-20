import { ClientButton } from "@thorium/components/ClientButton";
import { q } from "@thorium/context/AppContext";
import { IPAddress } from "@thorium/routes/landing/IPAddress";
import { useConfirm, usePrompt } from "@thorium/ui/AlertDialog";
import Button from "@thorium/ui/Button";
import { capitalCase } from "change-case";

export function LobbyHeader() {
	const [flight] = q.flight.active.useNetRequest();
	const prompt = usePrompt();
	const confirm = useConfirm();
	return (
		<div className="flex justify-between">
			<div>
				<h2 className="mb-2 text-xl font-bold text-white">
					Flight Name: <em>{flight?.name}</em>
				</h2>
				<h3 className="mb-2 text-lg font-bold text-white">
					Flight Mode: <em>{capitalCase(flight?.mode || "")}</em>
				</h3>

				<ClientButton />
				<IPAddress />
				<h4 className="mb-1 text-lg font-semibold text-white">Snapshots</h4>
				<ul className="panel mb-1 h-32 overflow-y-auto">
					{flight?.snapshots.map((s) => (
						<li
							key={s}
							className="list-group-item list-group-item-small"
							onClick={async () => {
								if (
									!(await confirm({
										header: "Are you sure you want to restore this snapshot?",
										body: "This will overwrite the flight data with the snapshot.",
									}))
								)
									return;
								await q.flight.restoreSnapshot.netSend({ name: s });
							}}
						>
							{s}
						</li>
					))}
				</ul>
				<Button
					className="btn-success btn-sm w-full"
					onClick={async () => {
						const name = await prompt("What is the name of the snapshot?");
						if (!name) return;
						await q.flight.snapshot.netSend({ name });
					}}
				>
					New Snapshot
				</Button>
			</div>
		</div>
	);
}
