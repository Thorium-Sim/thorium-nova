import { processTriggers } from "@thorium/utils/.server/evaluateEntityQuery";
import { System } from "@thorium/utils/ecs";

export class ProcessTriggersSystem extends System {
	postUpdate() {
		processTriggers(this.ecs);
	}
}
