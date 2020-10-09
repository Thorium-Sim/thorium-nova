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
    entity.updateComponent("shipAssignment", {shipId: "test", ship});
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
        "x": 0.0063,
        "y": 0,
        "z": 0,
      }
    `);
    ecs.update(2000);
    expect(ship.velocity).toMatchInlineSnapshot(`
      Object {
        "x": 0.0188,
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
        "x": 0.0188,
        "y": 0.0124,
        "z": -0.0008,
      }
    `);
    expect(ship.rotation).toMatchInlineSnapshot(`
      Object {
        "w": -0.9987613331112641,
        "x": 0.04975740630107862,
        "y": 0,
        "z": 0,
      }
    `);
    ecs.update(10 * 1000);
    expect(ship.rotation).toMatchInlineSnapshot(`
      Object {
        "w": 0.45297549766912815,
        "x": 0.8915229657790122,
        "y": 0,
        "z": 0,
      }
    `);
  });
});
