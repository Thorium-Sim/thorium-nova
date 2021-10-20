import {ECS, Entity} from "server/src/utils/ecs";
import {TimerSystem} from "../TimerSystem";

const server = {clients: {}, activeFlightName: "", thoriumId: ""};
describe("TimerSystem", () => {
  let ecs: ECS;
  let timerSystem: TimerSystem;
  beforeEach(() => {
    ecs = new ECS(server);
    timerSystem = new TimerSystem();
  });
  it("should initialize properly", () => {
    ecs.addSystem(timerSystem);
  });
  it("should properly access an entity with the timer system", async () => {
    const entity = new Entity(null, {
      timer: {time: "00:10:00", label: "Test", paused: false},
    });
    entity.updateComponent("timer", {time: "00:05:00"});
    ecs.addSystem(timerSystem);
    ecs.addEntity(entity);
    ecs.update();
    ecs.update(1000);
    expect(entity.components.timer?.time).toEqual("00:04:59");
  });
  it("should handle when the timer ends", async () => {
    const entity = new Entity(null, {});
    entity.updateComponent("timer", {time: "00:00:01"});
    ecs.addSystem(timerSystem);
    ecs.addEntity(entity);
    ecs.update();
    expect(ecs.entities.length).toEqual(1);
    ecs.update(1000);
    expect(entity.components.timer?.time).toEqual("00:00:00");
    expect(ecs.entities.length).toEqual(0);

    entity.updateComponent("timer", {time: "00:00:-10"});
    ecs.addEntity(entity);
    ecs.update();
    expect(ecs.entities.length).toEqual(1);
    ecs.update(1000);
    expect(ecs.entities.length).toEqual(0);
  });
});
