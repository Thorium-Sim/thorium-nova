import { SERVER_FPS } from "@thorium/live-query/constants";
import { System } from "../utils/ecs";

export class DataStreamSystem extends System {
	lastUpdate = Date.now();
	postUpdate() {
		if (Date.now() - this.lastUpdate > 1000 / SERVER_FPS) {
			for (const clientId in this.ecs.server.clients) {
				const client = this.ecs.server.clients[clientId];
				if (!client) continue;
				client.sendDataStream();
			}
			this.lastUpdate = Date.now();
		}
	}
}
