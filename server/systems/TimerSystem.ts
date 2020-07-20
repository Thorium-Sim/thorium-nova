import Entity from "s/helpers/ecs/entity";
import System from "s/helpers/ecs/system";
import {Duration} from "luxon";
import {pubsub} from "s/helpers/pubsub";
import App from "s/app";

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
      entity.components.timer.time = subtractTimer(
        entity.components.timer.time,
      );
    }
  }
  postUpdate() {
    if (this.timeCount >= 1000) {
      this.timeCount = 0;
      pubsub.publish("timers", {
        entities: App.activeFlight?.ecs.entities.filter(
          e => e.components.timer,
        ),
      });
    }
  }
}
