import { pubsub } from "@thorium/.server/init/pubsub";
import { componentEntityMaps } from "@thorium/.server/init/router";
import type { ComponentIds } from "@thorium/ecs-components";
import { System } from "@thorium/utils/ecs";
import { SERVER_FPS } from "@thorium/utils/live-query/constants";

export class DataStreamSystem extends System {
	static flightMode = ["nova", "legacy"];
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

		for (const key of this.ecs.changeBatch) {
			const [entityId, component] = key.split("-");
			const entity = this.ecs.getEntityById(Number(entityId));
			if (!entity) continue;
			componentEntityMaps
				.get(component as ComponentIds)
				?.forEach(({ entityMap, procedure }) => {
					const filter = entityMap(entity);
					if (Array.isArray(filter)) {
						for (const f of filter) {
							pubsub.directPublish(procedure, f);
						}
					} else {
						pubsub.directPublish(procedure, filter);
					}
				});
		}
		this.ecs.changeBatch.clear();
	}
}
