import { q } from "@thorium/context/AppContext";
import Button from "@thorium/ui/Button";

export function TrainingCore() {
	const [clients] = q.client.all.useNetRequest();
	return (
		<Button
			className="btn-outline btn-warning btn-xs"
			onClick={() => {
				for (const client of clients) {
					if (!client.training && client.stationId && client.connected) {
						q.client.startTraining.netSend({ clientId: client.clientId });
					}
				}
			}}
		>
			Start Training
		</Button>
	);
}
