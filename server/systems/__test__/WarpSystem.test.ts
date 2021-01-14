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
import {EngineVelocityPosition} from "../EngineVelocityPosition";
describe("WarpSystem", () => {
  let ecs: ECS;
  let warpSystem: WarpSystem;
  let engineVelocitySystem: EngineVelocitySystem;
  let warpVelocityPosition: EngineVelocityPosition;
  beforeEach(() => {
    ecs = new ECS();
    engineVelocitySystem = new EngineVelocitySystem();
    warpVelocityPosition = new EngineVelocityPosition();
    warpSystem = new WarpSystem();
  });
  it("should initialize properly", () => {
    ecs.addSystem(warpSystem);
  });
  it("should properly update an entity with the warp engines component", async () => {
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
    entity.updateComponent("shipAssignment", {shipId: "test"});
    ecs.addSystem(warpSystem);
    ecs.addSystem(engineVelocitySystem);
    ecs.addSystem(warpVelocityPosition);
    ecs.addEntity(entity);
    ecs.addEntity(ship);
    const engines = entity.warpEngines;
    expect(engines?.forwardAcceleration).toEqual(0);
    expect(engines?.maxVelocity).toEqual(0);
    ecs.update(1);
    expect(engines?.forwardAcceleration).toEqual(0);
    expect(engines?.maxVelocity).toEqual(0);
    expect(ship.position).toMatchInlineSnapshot(`
      Object {
        "x": 0,
        "y": 0,
        "z": 0,
      }
    `);
    entity.updateComponent("warpEngines", {currentWarpFactor: 1});
    ecs.update(16);
    expect(engines?.forwardAcceleration).toMatchInlineSnapshot(`29980`);
    expect(engines?.maxVelocity).toMatchInlineSnapshot(`299800`);
    ecs.update(1000);
    expect(engines?.forwardAcceleration).toMatchInlineSnapshot(`29980`);
    expect(engines?.maxVelocity).toMatchInlineSnapshot(`299800`);
    entity.updateComponent("warpEngines", {currentWarpFactor: 5});
    ecs.update(1000);
    expect(engines?.forwardVelocity).toMatchInlineSnapshot(`2998479.68`);
    ecs.update(5000);
    expect(engines?.forwardVelocity).toMatchInlineSnapshot(`17838579.68`);
    const initialPosition = ship.position?.y;

    entity.updateComponent("warpEngines", {currentWarpFactor: 0});
    for (let i = 0; i < 60 * 3; i++) {
      ecs.update(16);
    }
    expect(engines?.forwardAcceleration).toMatchInlineSnapshot(
      `-0.0988217916351965`
    );
    expect(engines?.forwardVelocity).toMatchInlineSnapshot(
      `0.018183209660876158`
    );
    const distanceTravelled = (ship.position?.z || 0) - (initialPosition || 0);
    expect(distanceTravelled).toMatchInlineSnapshot(`92232878.0715343`);
  });
});
