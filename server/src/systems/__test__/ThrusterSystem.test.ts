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

    ecs.update(1000);
    expect(ship.components.velocity).toMatchInlineSnapshot(`
      VelocityComponent {
        "x": 0.00625,
        "y": 0,
        "z": 0,
      }
    `);
    ecs.update(2000);
    expect(ship.components.velocity).toMatchInlineSnapshot(`
        VelocityComponent {
          "x": 0.01875,
          "y": 0,
          "z": 0,
        }
      `);

    entity.updateComponent("isThrusters", {
      direction: {x: 0, y: 1, z: 0},
      rotationDelta: {x: 1, y: 0, z: 0},
    });
    ecs.update(1000);
    ecs.update(1000);
    expect(ship.components.velocity).toMatchInlineSnapshot(`
      VelocityComponent {
        "x": 0.01875,
        "y": 0.0101371,
        "z": 0.0065592,
      }
    `);
    expect(ship.components.rotation).toMatchInlineSnapshot(`
      RotationComponent {
        "w": 0.9138825852226744,
        "x": 0.40597859602043207,
        "y": 0,
        "z": 0,
      }
    `);
    ecs.update(10 * 1000);
    expect(ship.components.rotation).toMatchInlineSnapshot(`
      RotationComponent {
        "w": -0.9944348328892493,
        "x": 0.10535351506490337,
        "y": 0,
        "z": 0,
      }
    `);
  });
});
