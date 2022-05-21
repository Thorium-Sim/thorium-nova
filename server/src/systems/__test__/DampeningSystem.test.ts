import {createMockDataContext} from "server/src/utils/createMockDataContext";
import {ECS, Entity} from "server/src/utils/ecs";
import {EngineVelocityPosition} from "../EngineVelocityPosition";
import {EngineVelocitySystem} from "../EngineVelocitySystem";
import {ImpulseSystem} from "../ImpulseSystem";
import {PositionVelocitySystem} from "../PositionVelocitySystem";
import {RotationSystem} from "../RotationSystem";
import {ThrusterSystem} from "../ThrusterSystem";

describe("DampeningSystem", () => {
  let ecs: ECS;
  let impulseSystem: ImpulseSystem;
  let thrustersSystem: ThrusterSystem;
  let engineVelocitySystem: EngineVelocitySystem;
  let engineVelocityPosition: EngineVelocityPosition;
  let positionVelocitySystem: PositionVelocitySystem;
  let rotationSystem: RotationSystem;
  beforeEach(() => {
    const mockDataContext = createMockDataContext();

    ecs = new ECS(mockDataContext.server);
    thrustersSystem = new ThrusterSystem();
    engineVelocitySystem = new EngineVelocitySystem();
    impulseSystem = new ImpulseSystem();
    rotationSystem = new RotationSystem();
    engineVelocityPosition = new EngineVelocityPosition();
    positionVelocitySystem = new PositionVelocitySystem();
  });
  it("should initialize properly", () => {
    ecs.addSystem(impulseSystem);
  });
  it("should properly update an entity with the impulse component", async () => {
    const impulse = new Entity();
    impulse.addComponent("isImpulseEngines");
    impulse.addComponent("isShipSystem", {type: "impulseEngines"});
    const thrusters = new Entity();
    thrusters.addComponent("isThrusters");
    thrusters.addComponent("isShipSystem", {type: "thrusters"});
    const dampening = new Entity();
    dampening.addComponent("isInertialDampeners");
    dampening.addComponent("isShipSystem", {type: "inertialDampeners"});

    const ship = new Entity();
    ship.addComponent("isShip");
    ship.addComponent("mass", {mass: 2000});
    ship.addComponent("position", {type: "solar"});
    ship.addComponent("velocity");
    ship.addComponent("rotation");

    ship.updateComponent("shipSystems", {
      shipSystemIds: [impulse.id, thrusters.id, dampening.id],
    });

    ecs.addSystem(impulseSystem);
    ecs.addSystem(thrustersSystem);
    ecs.addSystem(rotationSystem);
    ecs.addSystem(engineVelocitySystem);
    ecs.addSystem(engineVelocityPosition);
    ecs.addSystem(positionVelocitySystem);
    ecs.addEntity(impulse);
    ecs.addEntity(thrusters);
    ecs.addEntity(dampening);
    ecs.addEntity(ship);
    if (!ship.components.velocity)
      throw new Error("Ship has no velocity component");
    if (!ship.components.rotation)
      throw new Error("Ship has no rotation component");
    impulse.updateComponent("isImpulseEngines", {targetSpeed: 500});
    for (let i = 0; i < 60 * 5; i++) {
      ecs.update(16);
    }
    if (!ship.components.position) throw new Error("No position");
    expect(Math.round(ship.components.position.z)).toMatchInlineSnapshot(`24`);
    impulse.updateComponent("isImpulseEngines", {targetSpeed: 10});
    ecs.update(100);
    expect(Math.round(ship.components.position.z)).toMatchInlineSnapshot(`25`);
    for (let i = 0; i < 60 * 3; i++) {
      ecs.update(16);
    }
    expect(Math.round(ship.components.position.z)).toMatchInlineSnapshot(`54`);
    impulse.updateComponent("isImpulseEngines", {targetSpeed: 500});
    for (let i = 0; i < 60 * 11; i++) {
      ecs.update(16);
    }
    expect(Math.round(ship.components.position.z)).toMatchInlineSnapshot(`276`);

    ship.components.rotation.x = 0.7071067811865475;
    ship.components.rotation.w = 0.7071067811865475;

    for (let i = 0; i < 60 * 11; i++) {
      ecs.update(16);
    }
    expect(Math.round(ship.components.position.x)).toMatchInlineSnapshot(`0`);
    expect(Math.round(ship.components.position.y)).toMatchInlineSnapshot(
      `-454`
    );
    expect(Math.round(ship.components.position.z)).toMatchInlineSnapshot(`276`);

    ship.components.velocity.z = 1500;

    impulse.updateComponent("isImpulseEngines", {targetSpeed: 0});
    for (let i = 0; i < 60 * 11; i++) {
      ecs.update(16);
    }
    expect(ship.components.velocity.z).toMatchInlineSnapshot(`0.039719`);

    // Test the thrusters too
    ship.components.velocity.x = 0;
    ship.components.velocity.y = 0;
    ship.components.velocity.z = 0;
    ship.components.rotation.x = 0;
    ship.components.rotation.w = 1;

    thrusters.updateComponent("isThrusters", {
      directionMaxSpeed: 50,
      direction: {x: 0, y: 0, z: 1},
    });
    for (let i = 0; i < 60 * 3; i++) {
      ecs.update(16);
    }
    expect(ship.components.velocity.z).toMatchInlineSnapshot(`0.018`);

    thrusters.updateComponent("isThrusters", {
      direction: {x: 0, y: 0, z: 0},
    });
    for (let i = 0; i < 60 * 3; i++) {
      ecs.update(16);
    }
    expect(ship.components.velocity.z).toMatchInlineSnapshot(`0.0010161`);

    thrusters.updateComponent("isThrusters", {
      rotationDelta: {x: 1, y: 0, z: 0},
    });
    expect(ship.components.rotation).toMatchInlineSnapshot(`
      RotationComponent {
        "w": 1,
        "x": 0,
        "y": 0,
        "z": 0,
      }
    `);
    for (let i = 0; i < 60 * 5; i++) {
      ecs.update(16);
    }
    expect(ship.components.rotation).toMatchInlineSnapshot(`
      RotationComponent {
        "w": 0.5067351256482651,
        "x": 0.8621017993451933,
        "y": 0,
        "z": 0,
      }
    `);
    expect(thrusters.components.isThrusters?.rotationVelocity)
      .toMatchInlineSnapshot(`
      Coordinates {
        "x": 0.5235987755982988,
        "y": 0,
        "z": 0,
      }
    `);
    thrusters.updateComponent("isThrusters", {
      rotationDelta: {x: 0, y: 0, z: 0},
    });
    for (let i = 0; i < 60 * 1; i++) {
      ecs.update(16);
    }
    expect(ship.components.rotation).toMatchInlineSnapshot(`
      RotationComponent {
        "w": 0.5067351256482651,
        "x": 0.8621017993451933,
        "y": 0,
        "z": 0,
      }
    `);
    expect(thrusters.components.isThrusters?.rotationVelocity)
      .toMatchInlineSnapshot(`
      Coordinates {
        "x": 0,
        "y": 0,
        "z": 0,
      }
    `);
  });
});
