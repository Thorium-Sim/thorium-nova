import Entity from "../entity";
import System from "../system";
import {vi} from "vitest";

function getFakeEntity() {
  return {
    addSystem: vi.fn(),
    removeSystem: vi.fn(),
  } as unknown as Entity;
}

describe("System", () => {
  it("should initialize", () => {
    let system = new System();
    expect(system).toBeTruthy();
  });

  describe("addEntity()", () => {
    let entity: Entity, system: System;

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
      system.enter = vi.fn();

      system.addEntity(entity);

      expect(system.enter).toBeCalledWith(entity);
    });
  });

  describe("removeEntity()", () => {
    let entity: Entity, system: System;
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
      system.exit = vi.fn();

      system.removeEntity(entity);

      expect(system.exit).toBeCalledWith(entity);
    });
  });

  describe("updateAll()", () => {
    it("should call update() on each entity", () => {
      let entity1 = getFakeEntity();
      let entity2 = getFakeEntity();
      let system = new System();
      system.update = vi.fn();

      system.addEntity(entity1);
      system.addEntity(entity2);
      system.updateAll();

      expect(system.update).toBeCalledTimes(2);
    });

    it("should call preUpdate()", () => {
      let system = new System();
      system.preUpdate = vi.fn();

      system.updateAll();

      expect(system.preUpdate).toBeCalled();
    });

    it("should call postUpdate()", () => {
      let system = new System();
      system.postUpdate = vi.fn();

      system.updateAll();

      expect(system.postUpdate).toBeCalled();
    });
  });
});
