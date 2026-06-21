import { System } from "@thorium/utils/ecs";

export class ProcessTriggersSystem extends System {
	static flightMode = ["nova", "legacy"];
	postUpdate() {
		this.ecs.processTriggers();
	}
}
