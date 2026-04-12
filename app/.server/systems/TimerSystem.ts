import { type Entity, System } from "@thorium/utils/ecs";
import { executeBlocks } from "@thorium/utils/.server/executeBlocks";

export class TimerSystem extends System {
	static flightMode = ["nova", "legacy"];
	test(entity: Entity) {
		return !!entity.components.timer;
	}
	update(entity: Entity, elapsed: number) {
		if (entity.components.timer && !entity.components.timer?.paused) {
			entity.updateComponent("timer", {
				remainingDurationMs:
					entity.components.timer.remainingDurationMs - elapsed,
			});
			if (entity.components.timer.remainingDurationMs <= 0) {
				this.complete(entity);
			}
		}
	}
	complete(entity: Entity) {
		const completeBlocks = entity.components.timer?.completeBlocks || [];
		const blockMetadata = entity.components.timer?.blockMetadata || {};

		executeBlocks(this.ecs, completeBlocks, blockMetadata);

		this.ecs.removeEntityById(entity.id);
	}
}
