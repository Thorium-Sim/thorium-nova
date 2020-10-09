import {IsShipComponent} from "server/components/isShip";
import {DampenerComponent} from "server/components/outfits/dampeners";
import {ImpulseEnginesComponent} from "server/components/outfits/impulseEngines";
import {IsOutfitComponent} from "server/components/outfits/isOutfit";
import {ThrustersComponent} from "server/components/outfits/thrusters";
import {PositionComponent} from "server/components/position";
import {RotationComponent} from "server/components/rotation";
import {ShipAssignmentComponent} from "server/components/ship/shipAssignment";
import {VelocityComponent} from "server/components/velocity";
import {TimerComponent} from "../../components/timer";
import ECS from "../../helpers/ecs/ecs";
import Entity from "../../helpers/ecs/entity";
import {EngineVelocitySystem} from "../EngineVelocitySystem";
import {ImpulseSystem} from "../ImpulseSystem";
import {RotationSystem} from "../RotationSystem";
import {ThrusterSystem} from "../ThrusterSystem";

describe("ImpulseSystem", () => {
  let ecs: ECS;
  let impulseSystem: ImpulseSystem;
  let thrustersSystem: ThrusterSystem;
  let engineVelocitySystem: EngineVelocitySystem;
  let rotationSystem: RotationSystem;
  beforeEach(() => {
    ecs = new ECS();
    thrustersSystem = new ThrusterSystem();
    engineVelocitySystem = new EngineVelocitySystem();
    impulseSystem = new ImpulseSystem();
    rotationSystem = new RotationSystem();
  });
  it("should initialize properly", () => {
    ecs.addSystem(impulseSystem);
  });
  it("should properly update an entity with the impulse component", async () => {
    const impulse = new Entity(null, [
      ImpulseEnginesComponent,
      IsOutfitComponent,
      ShipAssignmentComponent,
    ]);
    const thrusters = new Entity(null, [
      ThrustersComponent,
      IsOutfitComponent,
      ShipAssignmentComponent,
    ]);
    const dampening = new Entity(null, [
      DampenerComponent,
      IsOutfitComponent,
      ShipAssignmentComponent,
    ]);
    const ship = new Entity("test", [
      IsShipComponent,
      PositionComponent,
      VelocityComponent,
      RotationComponent,
    ]);
    impulse.updateComponent("shipAssignment", {shipId: "test", ship});
    impulse.updateComponent("impulseEngines", {thrust: 12500});

    thrusters.updateComponent("shipAssignment", {shipId: "test", ship});
    dampening.updateComponent("shipAssignment", {shipId: "test", ship});

    ecs.addSystem(impulseSystem);
    ecs.addSystem(thrustersSystem);
    ecs.addSystem(rotationSystem);
    ecs.addSystem(engineVelocitySystem);
    ecs.addEntity(impulse);
    ecs.addEntity(thrusters);
    ecs.addEntity(dampening);
    ecs.addEntity(ship);
    if (!ship.velocity) throw new Error("Ship has no velocity component");
    if (!ship.rotation) throw new Error("Ship has no rotation component");
    impulse.updateComponent("impulseEngines", {targetSpeed: 500});
    for (let i = 0; i < 60 * 5; i++) {
      ecs.update(16);
    }
    expect(ship.velocity?.y).toMatchInlineSnapshot(`60`);
    impulse.updateComponent("impulseEngines", {targetSpeed: 10});
    ecs.update(100);
    expect(ship.velocity?.y).toMatchInlineSnapshot(`54.0594`);
    for (let i = 0; i < 60 * 3; i++) {
      ecs.update(16);
    }
    expect(ship.velocity?.y).toMatchInlineSnapshot(`9.9198`);
    impulse.updateComponent("impulseEngines", {targetSpeed: 500});
    for (let i = 0; i < 60 * 11; i++) {
      ecs.update(16);
    }
    expect(ship.velocity?.y).toMatchInlineSnapshot(`141.9198`);

    ship.rotation.x = 0.7071067811865475;
    ship.rotation.w = 0.7071067811865475;

    for (let i = 0; i < 60 * 11; i++) {
      ecs.update(16);
    }
    expect(ship.velocity?.x).toMatchInlineSnapshot(`0`);
    expect(ship.velocity?.y).toMatchInlineSnapshot(`0.0035`);
    expect(ship.velocity?.z).toMatchInlineSnapshot(`132`);

    ship.velocity.y = 1500;

    impulse.updateComponent("impulseEngines", {targetSpeed: 0});
    for (let i = 0; i < 60 * 11; i++) {
      ecs.update(16);
    }
    expect(ship.velocity?.y).toMatchInlineSnapshot(`0.0397`);

    // Test the thrusters too
    ship.velocity.x = 0;
    ship.velocity.y = 0;
    ship.velocity.z = 0;
    ship.rotation.x = 0;
    ship.rotation.w = 1;

    thrusters.updateComponent("thrusters", {
      directionMaxSpeed: 50,
      direction: {x: 0, y: 0, z: 1},
    });
    for (let i = 0; i < 60 * 3; i++) {
      ecs.update(16);
    }
    expect(ship.velocity.z).toMatchInlineSnapshot(`0.018`);

    thrusters.updateComponent("thrusters", {
      direction: {x: 0, y: 0, z: 0},
    });
    for (let i = 0; i < 60 * 3; i++) {
      ecs.update(16);
    }
    expect(ship.velocity.z).toMatchInlineSnapshot(`0.0031`);

    thrusters.updateComponent("thrusters", {
      rotationDelta: {x: 1, y: 0, z: 0},
    });
    expect(ship.rotation).toMatchInlineSnapshot(`
      Object {
        "w": 1,
        "x": 0,
        "y": 0,
        "z": 0,
      }
    `);
    for (let i = 0; i < 60 * 3; i++) {
      ecs.update(16);
    }
    expect(ship.rotation).toMatchInlineSnapshot(`
      Object {
        "w": 0.8935391577200112,
        "x": 0.44898527105130115,
        "y": 0,
        "z": 0,
      }
    `);
    expect(thrusters.thrusters?.rotationVelocity).toMatchInlineSnapshot(`
      Coordinates {
        "x": 17.999999999999986,
        "y": 0,
        "z": 0,
      }
    `);
    thrusters.updateComponent("thrusters", {
      rotationDelta: {x: 0, y: 0, z: 0},
    });
    for (let i = 0; i < 60 * 3; i++) {
      ecs.update(16);
    }
    expect(ship.rotation).toMatchInlineSnapshot(`
          Object {
            "w": -0.868714920246488,
            "x": 0.49531241387747876,
            "y": 0,
            "z": 0,
          }
        `);
    expect(thrusters.thrusters?.rotationVelocity).toMatchInlineSnapshot(`
      Coordinates {
        "x": 1.0161888274983526,
        "y": 0,
        "z": 0,
      }
    `);
  });
});
