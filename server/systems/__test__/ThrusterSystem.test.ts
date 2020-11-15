import {IsShipComponent} from "server/components/isShip";
import {ImpulseEnginesComponent} from "server/components/outfits/impulseEngines";
import {IsOutfitComponent} from "server/components/outfits/isOutfit";
import {ThrustersComponent} from "server/components/outfits/thrusters";
import {PositionComponent} from "server/components/position";
import {RotationComponent} from "server/components/rotation";
import {ShipAssignmentComponent} from "server/components/ship/shipAssignment";
import {VelocityComponent} from "server/components/velocity";
import ECS from "../../helpers/ecs/ecs";
import Entity from "../../helpers/ecs/entity";
import {EngineVelocitySystem} from "../EngineVelocitySystem";
import {RotationSystem} from "../RotationSystem";
import {ThrusterSystem} from "../ThrusterSystem";

describe("ThrusterSystem", () => {
  let ecs: ECS;
  let thrusterSystem: ThrusterSystem;
  let engineVelocitySystem: EngineVelocitySystem;
  let rotationSystem: RotationSystem;
  beforeEach(() => {
    ecs = new ECS();
    engineVelocitySystem = new EngineVelocitySystem();
    thrusterSystem = new ThrusterSystem();
    rotationSystem = new RotationSystem();
  });
  it("should initialize properly", () => {
    ecs.addSystem(thrusterSystem);
  });
  it("should properly update an entity with the thrusters component", async () => {
    const entity = new Entity(null, [
      ThrustersComponent,
      IsOutfitComponent,
      ShipAssignmentComponent,
    ]);
    const ship = new Entity("test", [
      IsShipComponent,
      PositionComponent,
      VelocityComponent,
      RotationComponent,
    ]);
    entity.updateComponent("shipAssignment", {shipId: "test"});
    ecs.addSystem(thrusterSystem);
    ecs.addSystem(rotationSystem);
    ecs.addSystem(engineVelocitySystem);
    ecs.addEntity(entity);
    ecs.addEntity(ship);

    ecs.update(1);

    expect(entity.thrusters?.rotationVelocity).toEqual({x: 0, y: 0, z: 0});
    expect(entity.thrusters?.directionAcceleration).toEqual({x: 0, y: 0, z: 0});

    entity.updateComponent("thrusters", {direction: {x: 1, y: 0, z: 0}});

    ecs.update(1000);
    expect(ship.velocity).toMatchInlineSnapshot(`
      Object {
        "x": 0.00625,
        "y": 0,
        "z": 0,
      }
    `);
    ecs.update(2000);
    expect(ship.velocity).toMatchInlineSnapshot(`
      Object {
        "x": 0.01875,
        "y": 0,
        "z": 0,
      }
    `);

    entity.updateComponent("thrusters", {
      direction: {x: 0, y: 1, z: 0},
      rotationDelta: {x: 1, y: 0, z: 0},
    });
    ecs.update(1000);
    ecs.update(1000);
    expect(ship.velocity).toMatchInlineSnapshot(`
      Object {
        "x": 0.01875,
        "y": 0.0121897,
        "z": 0.002471,
      }
    `);
    expect(ship.rotation).toMatchInlineSnapshot(`
      Object {
        "w": 0.9887710779360422,
        "x": 0.14943813247359922,
        "y": 0,
        "z": 0,
      }
    `);
    ecs.update(10 * 1000);
    expect(ship.rotation).toMatchInlineSnapshot(`
      Object {
        "w": -0.9310199382567351,
        "x": 0.36496831995178025,
        "y": 0,
        "z": 0,
      }
    `);
  });
});
