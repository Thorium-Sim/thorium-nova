import { System } from "@thorium/utils/ecs";
import { SERVER_FPS } from "@thorium/utils/live-query/constants";

export class DataStreamSystem extends System {
	elapsed = 0;
	postUpdate(elapsed: number) {
		this.elapsed += elapsed;
		if (this.elapsed > 1000 / SERVER_FPS) {
			this.elapsed = 0;
			for (const clientId in this.ecs.server.clients) {
				const client = this.ecs.server.clients[clientId];
				if (!client) continue;
				client.sendDataStream();
			}
		}
	}
}
