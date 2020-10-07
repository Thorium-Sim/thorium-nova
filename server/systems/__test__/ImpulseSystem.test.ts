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
import {RotationSystem} from "../RotationSystem";

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
    entity.updateComponent("impulseEngines", {thrust: 12500});
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
      `6.25`
    );
    expect(ship.velocity?.y).toMatchInlineSnapshot(`0.1`);
    ecs.update(1000);
    expect(entity.impulseEngines?.forwardAcceleration).toMatchInlineSnapshot(
      `6.25`
    );
    expect(ship.velocity?.y).toMatchInlineSnapshot(`6.35`);

    ecs.update(30 * 1000);

    expect(entity.impulseEngines?.forwardAcceleration).toMatchInlineSnapshot(
      `6.25`
    );
    expect(ship.velocity?.y).toMatchInlineSnapshot(`193.85`);
    entity.updateComponent("impulseEngines", {targetSpeed: 10});
    ecs.update(50);
    expect(entity.impulseEngines?.forwardAcceleration).toMatchInlineSnapshot(
      `6.25`
    );
    // This should be equal to the snapshot above
    expect(ship.velocity?.y).toMatchInlineSnapshot(`193.85`);
    expect(entity.impulseEngines?.forwardAcceleration).toMatchInlineSnapshot(
      `6.25`
    );

    // Test newtonian thrust reversal
    entity.updateComponent("impulseEngines", {targetSpeed: 500});
    ship.updateComponent("rotation", {x: -1, y: 0, z: 0, w: 0});
    ecs.update(31 * 1000);
    expect(entity.impulseEngines?.forwardAcceleration).toMatchInlineSnapshot(
      `6.25`
    );
    // This should be very close to zero.
    expect(ship.velocity?.y).toMatchInlineSnapshot(`0.09999999999999432`);
  });
});
