import {TimerComponent} from "../../components/timer";
import ECS from "../../helpers/ecs/ecs";
import Entity from "../../helpers/ecs/entity";
import {TimerSystem} from "../TimerSystem";

describe("TimerSystem", () => {
  let ecs: ECS;
  let timerSystem: TimerSystem;
  beforeEach(() => {
    ecs = new ECS();
    timerSystem = new TimerSystem();
  });
  it("should initialize properly", () => {
    ecs.addSystem(timerSystem);
  });
  it("should properly access an entity with the timer system", async () => {
    const entity = new Entity(null, [TimerComponent]);
    entity.updateComponent("timer", {time: "00:05:00"});
    ecs.addSystem(timerSystem);
    ecs.addEntity(entity);
    ecs.update();
    ecs.update(1000);
    expect(entity.timer?.time).toEqual("00:04:59");
  });
  it("should handle when the timer ends", async () => {
    const entity = new Entity(null, [TimerComponent]);
    entity.updateComponent("timer", {time: "00:00:01"});
    ecs.addSystem(timerSystem);
    ecs.addEntity(entity);
    ecs.update();
    expect(ecs.entities.length).toEqual(1);
    ecs.update(1000);
    expect(entity.timer?.time).toEqual("00:00:00");
    expect(ecs.entities.length).toEqual(0);

    entity.updateComponent("timer", {time: "00:00:-10"});
    ecs.addEntity(entity);
    ecs.update();
    expect(ecs.entities.length).toEqual(1);
    ecs.update(1000);
    expect(ecs.entities.length).toEqual(0);
  });
});
