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
				<h2 className="text-white font-bold text-xl mb-2">
					Flight Name: <em>{flight?.name}</em>
				</h2>
				<h3 className="text-white font-bold text-lg mb-2">
					Flight Mode: <em>{capitalCase(flight?.mode || "")}</em>
				</h3>

				<ClientButton />
				<IPAddress />
				<h4 className="text-white font-semibold text-lg mb-1">Snapshots</h4>
				<ul className="panel h-32 overflow-y-auto mb-1">
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
