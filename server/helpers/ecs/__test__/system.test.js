import System from "../system";

function getFakeEntity() {
  return {
    addSystem: jest.fn(),
    removeSystem: jest.fn(),
  };
}

describe("System", () => {
  it("should initialize", () => {
    let system = new System();
    expect(system).toBeTruthy();
  });

  describe("addEntity()", () => {
    let entity, system;

    beforeEach(() => {
      entity = getFakeEntity();
      system = new System();
    });

    it("should add an entity to the system", () => {
      system.addEntity(entity);

      expect(system.entities.length).toEqual(1);
    });

    it("should add the system to entity systems", () => {
      system.addEntity(entity);

      expect(entity.addSystem).toBeCalledWith(system);
    });

    it("should call enter() on added entity", () => {
      system.enter = jest.fn();

      system.addEntity(entity);

      expect(system.enter).toBeCalledWith(entity);
    });
  });

  describe("removeEntity()", () => {
    let entity, system;

    beforeEach(() => {
      entity = getFakeEntity();
      system = new System();

      system.addEntity(entity);
    });

    it("should remove an entity from the system", () => {
      system.removeEntity(entity);

      expect(system.entities.length).toEqual(0);
    });

    it("should remove the system from entity systems", () => {
      system.removeEntity(entity);

      expect(entity.removeSystem).toBeCalledWith(system);
    });

    it("should call exit() on removed entity", () => {
      system.exit = jest.fn();

      system.removeEntity(entity);

      expect(system.exit).toBeCalledWith(entity);
    });
  });

  describe("updateAll()", () => {
    it("should call update() on each entity", () => {
      let entity1 = getFakeEntity();
      let entity2 = getFakeEntity();
      let system = new System();
      system.update = jest.fn();

      system.addEntity(entity1);
      system.addEntity(entity2);
      system.updateAll();

      expect(system.update).toBeCalledTimes(2);
    });

    it("should call preUpdate()", () => {
      let system = new System();
      system.preUpdate = jest.fn();

      system.updateAll();

      expect(system.preUpdate).toBeCalled();
    });

    it("should call postUpdate()", () => {
      let system = new System();
      system.postUpdate = jest.fn();

      system.updateAll();

      expect(system.postUpdate).toBeCalled();
    });
  });
});
