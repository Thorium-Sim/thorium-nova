import {createMockDataContext} from "server/src/utils/createMockDataContext";
import {ECS, Entity} from "server/src/utils/ecs";
import {AutoRotateSystem} from "../AutoRotateSystem";
import {RotationSystem} from "../RotationSystem";
import {ThrusterSystem} from "../ThrusterSystem";

describe("AutoRotateSystem", () => {
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
      mass: {mass: 2000},
      position: {},
      velocity: {},
      rotation: {},
      rotationVelocity: {},
      autopilot: {},
      shipSystems: {shipSystemIds: [thrusters.id, dampening.id]},
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
      RotationComponent {
        "w": 0.9999999992,
        "x": -0.00003999999998933334,
        "y": 0,
        "z": 0,
      }
    `);
    for (let i = 0; i < 60 * 50; i++) {
      ecs.update(16);
    }

    expect(ship.components.rotation).toMatchInlineSnapshot(`
      RotationComponent {
        "w": 0.9229762896655683,
        "x": -0.384856815861667,
        "y": 4.208942449290669e-16,
        "z": 8.61779774125045e-16,
      }
    `);
  });
});
