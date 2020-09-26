import {IsShipComponent} from "server/components/isShip";
import {ImpulseEnginesComponent} from "server/components/outfits/impulseEngines";
import {IsOutfitComponent} from "server/components/outfits/isOutfit";
import {PositionComponent} from "server/components/position";
import {RotationComponent} from "server/components/rotation";
import {ShipAssignmentComponent} from "server/components/ship/shipAssignment";
import {VelocityComponent} from "server/components/velocity";
import {TimerComponent} from "../../components/timer";
import ECS from "../../helpers/ecs/ecs";
import Entity from "../../helpers/ecs/entity";
import {EngineVelocitySystem} from "../EngineVelocitySystem";
import {ImpulseSystem} from "../ImpulseSystem";

describe("ImpulseSystem", () => {
  let ecs: ECS;
  let impulseSystem: ImpulseSystem;
  let engineVelocitySystem: EngineVelocitySystem;
  beforeEach(() => {
    ecs = new ECS();
    engineVelocitySystem = new EngineVelocitySystem();
    impulseSystem = new ImpulseSystem();
  });
  it("should initialize properly", () => {
    ecs.addSystem(impulseSystem);
  });
  it("should properly update an entity with the impulse component", async () => {
    const entity = new Entity(null, [
      ImpulseEnginesComponent,
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
    entity.updateComponent("impulseEngines", {thrust: 2});
    ecs.addSystem(impulseSystem);
    ecs.addSystem(engineVelocitySystem);
    ecs.addEntity(entity);
    ecs.addEntity(ship);
    expect(entity.impulseEngines?.targetSpeed).toEqual(0);
    expect(entity.impulseEngines?.forwardAcceleration).toEqual(0);
    ecs.update(1);
    expect(entity.impulseEngines?.targetSpeed).toEqual(0);
    expect(entity.impulseEngines?.forwardAcceleration).toEqual(0);
    entity.updateComponent("impulseEngines", {targetSpeed: 500});
    expect(entity.impulseEngines?.targetSpeed).toEqual(500);
    ecs.update(16);
    expect(entity.impulseEngines?.forwardAcceleration).toMatchInlineSnapshot(
      `0.016`
    );
    expect(ship.velocity).toMatchInlineSnapshot(`
      VelocityComponent {
        "x": 0,
        "y": 0.000256,
        "z": 0,
      }
    `);
    ecs.update(1000);
    expect(entity.impulseEngines?.forwardAcceleration).toMatchInlineSnapshot(
      `1.000256`
    );
    expect(ship.velocity).toMatchInlineSnapshot(`
      VelocityComponent {
        "x": 0,
        "y": 1.000512,
        "z": 0,
      }
    `);
    ecs.update(4000);
    expect(entity.impulseEngines?.forwardAcceleration).toMatchInlineSnapshot(
      `8.002048`
    );
    expect(ship.velocity).toMatchInlineSnapshot(`
      VelocityComponent {
        "x": 0,
        "y": 33.008704,
        "z": 0,
      }
    `);
  });
});
