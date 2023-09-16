import {processTriggers} from "@server/utils/evaluateEntityQuery";
import {System} from "../utils/ecs";

export class ProcessTriggersSystem extends System {
  postUpdate() {
    processTriggers(this.ecs);
  }
}
