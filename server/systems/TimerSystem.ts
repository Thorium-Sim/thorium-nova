import Entity from "../helpers/ecs/entity";
import System from "../helpers/ecs/system";
import {Duration} from "luxon";
import {pubsub} from "../helpers/pubsub";

function subtractTimer(timer: string) {
  const [hours = "0", minutes = "0", seconds = "0"] = timer.split(":");
  const dur = Duration.fromObject({
    hours: parseInt(hours, 10),
    minutes: parseInt(minutes, 10),
    seconds: parseInt(seconds, 10),
  })
    .minus(1000)
    .normalize()
    .toFormat("hh:mm:ss");

  if (parseInt(seconds, 10) < 0) {
    throw new Error("Seconds has gone negative");
  }
  return dur;
}
export class TimerSystem extends System {
  timeCount = 0;
  test(entity: Entity) {
    return !!entity.components.timer;
  }
  preUpdate(elapsed: number) {
    this.timeCount += elapsed;
  }
  update(entity: Entity, elapsed: number) {
    if (
      entity.components.timer &&
      this.timeCount >= 1000 &&
      !entity.components.timer?.paused
    ) {
      try {
        entity.components.timer.time = subtractTimer(
          entity.components.timer.time,
        );
        if (entity.components.timer.time === "00:00:00") {
          this.ecs.removeEntityById(entity.id);
        }
      } catch (err) {
        if (err?.message == "Seconds has gone negative") {
          // Remove the entity
          this.ecs.removeEntityById(entity.id);
        }
      }
    }
  }
  postUpdate() {
    if (this.timeCount >= 1000) {
      this.timeCount = 0;
      pubsub.publish("timers", {
        entities: this.ecs.entities.filter(e => e.components.timer),
      });
    }
  }
}
