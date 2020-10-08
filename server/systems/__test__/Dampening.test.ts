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
    ecs.addSystem(engineVelocitySystem);
    ecs.addEntity(impulse);
    ecs.addEntity(thrusters);
    ecs.addEntity(dampening);
    ecs.addEntity(ship);

    impulse.updateComponent("impulseEngines", {targetSpeed: 500});
    for (let i = 0; i < 60 * 5; i++) {
      ecs.update(16);
    }
    expect(ship.velocity?.y).toMatchInlineSnapshot(`180`);
    impulse.updateComponent("impulseEngines", {targetSpeed: 10});
    ecs.update(100);
    expect(ship.velocity?.y).toMatchInlineSnapshot(`162.1782`);
    for (let i = 0; i < 60 * 3; i++) {
      ecs.update(16);
    }
    expect(ship.velocity?.y).toMatchInlineSnapshot(`9.866`);
    impulse.updateComponent("impulseEngines", {targetSpeed: 500});
    for (let i = 0; i < 60 * 11; i++) {
      ecs.update(16);
    }
    expect(ship.velocity?.y).toMatchInlineSnapshot(`405.866`);

    if (ship.rotation) {
      ship.rotation.x = 0.7071067811865475;
      ship.rotation.w = 0.7071067811865475;
    }
    for (let i = 0; i < 60 * 11; i++) {
      ecs.update(16);
    }
    expect(ship.velocity?.x).toMatchInlineSnapshot(`0`);
    expect(ship.velocity?.y).toMatchInlineSnapshot(`0.0109`);
    expect(ship.velocity?.z).toMatchInlineSnapshot(`396`);

    if (ship.velocity) {
      ship.velocity.y = 1500;
    }
    impulse.updateComponent("impulseEngines", {targetSpeed: 0});
    for (let i = 0; i < 60 * 11; i++) {
      ecs.update(16);
    }
    expect(ship.velocity?.y).toMatchInlineSnapshot(`0.0397`);
  });
});
