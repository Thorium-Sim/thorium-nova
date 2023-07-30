import {createMockDataContext} from "server/src/utils/createMockDataContext";
import {ECS, Entity} from "server/src/utils/ecs";
import {AutoRotateSystem} from "../AutoRotateSystem";
import {RotationSystem} from "../RotationSystem";
import {ThrusterSystem} from "../ThrusterSystem";

// This test is kind of flakey. The snapshots require updating
// every time tests are run. Unclear why.
describe.skip("AutoRotateSystem", () => {
  let ecs: ECS;
  let thrustersSystem: ThrusterSystem;
  let rotationSystem: RotationSystem;
  let autoRotateSystem: AutoRotateSystem;
  beforeEach(() => {
    const mockDataContext = createMockDataContext();
    ecs = new ECS(mockDataContext.server);
    thrustersSystem = new ThrusterSystem();
    rotationSystem = new RotationSystem();
    autoRotateSystem = new AutoRotateSystem();
  });
  it("should properly update an entity with the system destination component", async () => {
    const thrusters = new Entity(null, {
      isThrusters: {},
      isShipSystem: {type: "thrusters"},
    });
    const dampening = new Entity(null, {
      isInertialDampeners: {},
      isShipSystem: {type: "inertialDampeners"},
    });
    const ship = new Entity(100, {
      isShip: {},
      mass: {mass: 70000},
      position: {},
      velocity: {},
      rotation: {},
      rotationVelocity: {},
      autopilot: {},
      shipSystems: {
        shipSystems: new Map([
          [thrusters.id, {}],
          [dampening.id, {}],
        ]),
      },
    });

    ecs.addSystem(autoRotateSystem);
    ecs.addSystem(thrustersSystem);
    ecs.addSystem(rotationSystem);
    ecs.addEntity(thrusters);
    ecs.addEntity(dampening);
    ecs.addEntity(ship);
    if (!ship.components.velocity)
      throw new Error("Ship has no velocity component");
    if (!ship.components.rotation)
      throw new Error("Ship has no rotation component");
    ship.updateComponent("autopilot", {
      desiredCoordinates: {x: 0, y: 100, z: 100},
    });
    ecs.update(16);
    expect(ship.components.rotation).toMatchInlineSnapshot(`
      Object {
        "w": 0.9999912270311376,
        "x": -0.004188777955403881,
        "y": 6.192184396419897e-19,
        "z": -2.564886757712179e-19,
      }
    `);
    for (let i = 0; i < 60 * 50; i++) {
      ecs.update(16);
    }

    expect(ship.components.rotation).toMatchInlineSnapshot(`
      Object {
        "w": 0.9238795325112867,
        "x": -0.38268343236508984,
        "y": 5.4048322458121166e-17,
        "z": -2.9523622180122583e-17,
      }
    `);
    expect(
      thrusters.components.isThrusters?.autoRotationVelocity
    ).toMatchInlineSnapshot(`0.00815152085541697`);

    // Let's see if we can wonkify it
    ship.updateComponent("autopilot", {
      desiredCoordinates: {x: 500 / 13, y: -1000 / 13, z: 2000 / 13},
    });
    ecs.update(16);
    expect(ship.components.rotation).toMatchInlineSnapshot(`
      Object {
        "w": 0.9252641056657583,
        "x": -0.37931785220505165,
        "y": 0.0011478880311793197,
        "z": -0.0017274600310309926,
      }
    `);
    for (let i = 0; i < 60 * 30; i++) {
      ecs.update(16);
    }
    expect(ship.components.rotation).toMatchInlineSnapshot(`
      Object {
        "w": 0.9563685301630789,
        "x": 0.20566153737682227,
        "y": 0.14583398634000644,
        "z": -0.14763134824859095,
      }
    `);
    expect(
      thrusters.components.isThrusters?.autoRotationVelocity
    ).toMatchInlineSnapshot(`0.008161452597421157`);
    for (let i = 0; i < 60 * 30; i++) {
      ecs.update(16);
    }
    expect(ship.components.rotation).toMatchInlineSnapshot(`
      Object {
        "w": 0.9563685301630789,
        "x": 0.20566153737682227,
        "y": 0.14583398634000644,
        "z": -0.14763134824859095,
      }
    `);
    expect(
      thrusters.components.isThrusters?.autoRotationVelocity
    ).toMatchInlineSnapshot(`0.008166817015449693`);
  });
});
