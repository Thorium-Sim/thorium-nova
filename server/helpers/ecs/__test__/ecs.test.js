import ECS from "../ecs";
import Entity from "../entity";
import System from "../system";

describe("ECS", () => {
  it("should initialize", () => {
    let ecs = new ECS();

    expect(Array.isArray(ecs.entities)).toBeTruthy();
    expect(Array.isArray(ecs.systems)).toBeTruthy();
  });

  describe("getEntityById()", () => {
    it("should retrieve an entity by id", () => {
      let ecs = new ECS();
      let entity = new Entity(123);

      ecs.addEntity(entity);

      expect(ecs.getEntityById(123)).toEqual(entity);
    });
  });

  describe("update()", () => {
    let ecs, entity, system;

    beforeEach(() => {
      ecs = new ECS();
      entity = new Entity();
      system = new System();
    });

    it("should give the elapsed time to update methods", done => {
      system.test = () => true;
      system.update = (entity, elapsed) => {
        expect(typeof elapsed).toBe("number");
        done();
      };

      ecs.addSystem(system);
      ecs.addEntity(entity);

      ecs.update();
    });
  });

  describe("addSystem()", () => {
    let ecs, entity, system;

    beforeEach(() => {
      ecs = new ECS();
      entity = new Entity();
      system = new System();
    });

    it("should call enter() when update", () => {
      system.test = () => true;
      system.enter = jest.fn();
      ecs.addSystem(system);
      ecs.addEntity(entity);

      ecs.update();

      expect(system.enter).toBeCalledWith(entity);
    });

    it("should call enter() when removing and re-adding a system", () => {
      system.test = () => true;
      system.enter = jest.fn();
      ecs.addSystem(system);
      ecs.addEntity(entity);
      ecs.update();

      ecs.removeSystem(system);
      ecs.update();

      ecs.addSystem(system);
      ecs.update();

      expect(system.enter).toHaveBeenCalledTimes(2);
    });
  });

  describe("removeSystem()", () => {
    let ecs, entity, system;

    beforeEach(() => {
      ecs = new ECS();
      entity = new Entity();
      system = new System();
    });

    it("should call exit(entity) when removed", () => {
      system.test = () => true;
      system.exit = jest.fn();

      ecs.addSystem(system);
      ecs.addEntity(entity);

      ecs.update();

      ecs.removeSystem(system);

      expect(system.exit).toBeCalledWith(entity);
    });

    it("should call exit(entity) of all systems when removed", () => {
      system.test = () => true;
      system.exit = jest.fn();

      ecs.addSystem(system);
      ecs.addEntity(entity);

      ecs.update();

      ecs.removeSystem(system);

      expect(system.exit).toBeCalledWith(entity);
    });
  });

  describe("removeEntity()", () => {
    let ecs, entity, system1, system2;

    beforeEach(() => {
      ecs = new ECS();
      entity = new Entity();
      system1 = new System();
      system2 = new System();
    });

    it("should call exit(entity) when removed", () => {
      system1.test = () => true;
      system1.exit = jest.fn();

      ecs.addSystem(system1);
      ecs.addEntity(entity);

      ecs.update();

      ecs.removeEntity(entity);

      expect(system1.exit).toBeCalledWith(entity);
    });

    it("should call exit(entity) of all systems when removed", () => {
      system2.test = () => true;
      system2.exit = jest.fn();
      system1.test = () => true;
      system1.exit = jest.fn();

      ecs.addSystem(system1);
      ecs.addSystem(system2);
      ecs.addEntity(entity);

      ecs.update();

      ecs.removeEntity(entity);

      expect(system1.exit).toBeCalledWith(entity);
      expect(system2.exit).toBeCalledWith(entity);
    });
  });
});
