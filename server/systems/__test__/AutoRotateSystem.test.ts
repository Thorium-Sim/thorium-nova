import {IsShipComponent} from "server/components/isShip";
import {DampenerComponent} from "server/components/outfits/dampeners";
import {IsOutfitComponent} from "server/components/outfits/isOutfit";
import {ThrustersComponent} from "server/components/outfits/thrusters";
import {PositionComponent} from "server/components/position";
import {RotationComponent} from "server/components/rotation";
import {ShipAssignmentComponent} from "server/components/ship/shipAssignment";
import {AutopilotComponent} from "server/components/ship/autopilot";
import {VelocityComponent} from "server/components/velocity";
import ECS from "../../helpers/ecs/ecs";
import Entity from "../../helpers/ecs/entity";
import {AutoRotateSystem} from "../AutoRotateSystem";
import {RotationSystem} from "../RotationSystem";
import {ThrusterSystem} from "../ThrusterSystem";

describe("ImpulseSystem", () => {
  let ecs: ECS;
  let thrustersSystem: ThrusterSystem;
  let rotationSystem: RotationSystem;
  let autoRotateSystem: AutoRotateSystem;
  beforeEach(() => {
    ecs = new ECS();
    thrustersSystem = new ThrusterSystem();
    rotationSystem = new RotationSystem();
    autoRotateSystem = new AutoRotateSystem();
  });
  it("should properly update an entity with the system destination component", async () => {
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
      AutopilotComponent,
    ]);

    thrusters.updateComponent("shipAssignment", {shipId: "test"});
    dampening.updateComponent("shipAssignment", {shipId: "test"});

    ecs.addSystem(autoRotateSystem);
    ecs.addSystem(thrustersSystem);
    ecs.addSystem(rotationSystem);
    ecs.addEntity(thrusters);
    ecs.addEntity(dampening);
    ecs.addEntity(ship);
    if (!ship.velocity) throw new Error("Ship has no velocity component");
    if (!ship.rotation) throw new Error("Ship has no rotation component");
    ship.updateComponent("autopilot", {
      desiredCoordinates: {x: 0, y: 100, z: 100},
    });
    ecs.update(16);
    expect(ship.rotation).toMatchInlineSnapshot(`
      Object {
        "w": 0.9999996999560193,
        "x": -0.00077465338786983,
        "y": 0,
        "z": 0,
      }
    `);
    for (let i = 0; i < 60 * 50; i++) {
      ecs.update(16);
    }

    expect(ship.rotation).toMatchInlineSnapshot(`
      Object {
        "w": 0.9238795325112883,
        "x": -0.3826834323650894,
        "y": 0,
        "z": 0,
      }
    `);
  });
});