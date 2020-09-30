import {IsShipComponent} from "server/components/isShip";
import {IsOutfitComponent} from "server/components/outfits/isOutfit";
import {WarpEnginesComponent} from "server/components/outfits/warpEngines";
import {PositionComponent} from "server/components/position";
import {RotationComponent} from "server/components/rotation";
import {ShipAssignmentComponent} from "server/components/ship/shipAssignment";
import {VelocityComponent} from "server/components/velocity";
import ECS from "../../helpers/ecs/ecs";
import Entity from "../../helpers/ecs/entity";
import {EngineVelocitySystem} from "../EngineVelocitySystem";
import {WarpSystem} from "../WarpSystem";
describe("WarpSystem", () => {
  let ecs: ECS;
  let warpSystem: WarpSystem;
  let engineVelocitySystem: EngineVelocitySystem;
  beforeEach(() => {
    ecs = new ECS();
    engineVelocitySystem = new EngineVelocitySystem();
    warpSystem = new WarpSystem();
  });
  it("should initialize properly", () => {
    ecs.addSystem(warpSystem);
  });
  it("should properly update an entity with the impulse component", async () => {
    const entity = new Entity(null, [
      WarpEnginesComponent,
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
    ecs.addSystem(warpSystem);
    ecs.addSystem(engineVelocitySystem);
    ecs.addEntity(entity);
    ecs.addEntity(ship);
    expect(entity.warpEngines?.forwardAcceleration).toEqual(0);
    expect(entity.warpEngines?.maxVelocity).toEqual(0);
    ecs.update(1);
    expect(entity.warpEngines?.forwardAcceleration).toEqual(0);
    expect(entity.warpEngines?.maxVelocity).toEqual(0);
    entity.updateComponent("warpEngines", {currentWarpFactor: 1});
    ecs.update(16);
    expect(entity.warpEngines?.forwardAcceleration).toMatchInlineSnapshot(
      `29980`
    );
    expect(entity.warpEngines?.maxVelocity).toMatchInlineSnapshot(`299800`);
    expect(ship.velocity?.y).toMatchInlineSnapshot(`479.68`);
    ecs.update(1000);
    expect(entity.warpEngines?.forwardAcceleration).toMatchInlineSnapshot(
      `29980`
    );
    expect(entity.warpEngines?.maxVelocity).toMatchInlineSnapshot(`299800`);
    expect(ship.velocity?.y).toMatchInlineSnapshot(`30459.68`);

    entity.updateComponent("warpEngines", {currentWarpFactor: 5});
    ecs.update(1000);
    expect(entity.warpEngines?.maxVelocity).toMatchInlineSnapshot(`29680200`);
    expect(ship.velocity?.y).toMatchInlineSnapshot(`2998479.68`);
    ecs.update(5000);
    expect(entity.warpEngines?.maxVelocity).toMatchInlineSnapshot(`29680200`);
    expect(ship.velocity?.y).toMatchInlineSnapshot(`17838579.68`);
  });
});
