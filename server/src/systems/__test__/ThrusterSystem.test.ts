import {createMockDataContext} from "server/src/utils/createMockDataContext";
import {ECS, Entity} from "server/src/utils/ecs";
import {EngineVelocitySystem} from "../EngineVelocitySystem";
import {RotationSystem} from "../RotationSystem";
import {ThrusterSystem} from "../ThrusterSystem";

describe("ThrusterSystem", () => {
  let ecs: ECS;
  let thrusterSystem: ThrusterSystem;
  let engineVelocitySystem: EngineVelocitySystem;
  let rotationSystem: RotationSystem;
  beforeEach(() => {
    const mockDataContext = createMockDataContext();

    ecs = new ECS(mockDataContext.server);
    engineVelocitySystem = new EngineVelocitySystem();
    thrusterSystem = new ThrusterSystem();
    rotationSystem = new RotationSystem();
  });
  it("should initialize properly", () => {
    ecs.addSystem(thrusterSystem);
  });
  it("should properly update an entity with the thrusters component", async () => {
    const entity = new Entity();
    entity.addComponent("isThrusters");
    entity.addComponent("isShipSystem", {type: "thrusters"});

    const ship = new Entity();
    ship.addComponent("isShip");
    ship.addComponent("mass", {mass: 2000});
    ship.addComponent("position");
    ship.addComponent("velocity");
    ship.addComponent("rotation");
    ship.addComponent("shipSystems", {shipSystems: new Map([[entity.id, {}]])});
    ecs.addSystem(thrusterSystem);
    ecs.addSystem(rotationSystem);
    ecs.addSystem(engineVelocitySystem);
    ecs.addEntity(entity);
    ecs.addEntity(ship);

    ecs.update(1);

    expect(entity.components.isThrusters?.directionThrust).toEqual(12500);
    expect(entity.components.isThrusters?.rotationVelocity).toEqual({
      x: 0,
      y: 0,
      z: 0,
    });
    expect(entity.components.isThrusters?.directionAcceleration).toEqual({
      x: 0,
      y: 0,
      z: 0,
    });

    entity.updateComponent("isThrusters", {direction: {x: 1, y: 0, z: 0}});

    for (let i = 0; i < 60; i++) {
      ecs.update(16);
    }
    expect(ship.components.velocity).toMatchInlineSnapshot(`
      Object {
        "x": 0.006,
        "y": 0,
        "z": 0,
      }
    `);
    for (let i = 0; i < 60 * 2; i++) {
      ecs.update(16);
    }
    expect(ship.components.velocity).toMatchInlineSnapshot(`
      Object {
        "x": 0.018,
        "y": 0,
        "z": 0,
      }
    `);

    entity.updateComponent("isThrusters", {
      direction: {x: 0, y: 1, z: 0},
      rotationDelta: {x: 1, y: 0, z: 0},
    });
    for (let i = 0; i < 60 * 2; i++) {
      ecs.update(16);
    }
    expect(ship.components.velocity).toMatchInlineSnapshot(`
      Object {
        "x": 0.018,
        "y": 0.0115944,
        "z": 0.0022997,
      }
    `);
    expect(ship.components.rotation).toMatchInlineSnapshot(`
      Object {
        "w": 0.9595433007677061,
        "x": 0.28156110163126624,
        "y": 0,
        "z": 0,
      }
    `);
    for (let i = 0; i < 60 * 10; i++) {
      ecs.update(16);
    }
    expect(ship.components.rotation).toMatchInlineSnapshot(`
      Object {
        "w": -0.9417843003177649,
        "x": 0.3362176849526648,
        "y": 0,
        "z": 0,
      }
    `);
  });
});
