import {createMockDataContext} from "server/src/utils/createMockDataContext";
import {ECS, Entity} from "server/src/utils/ecs";
import {ImpulseSystem} from "../ImpulseSystem";

describe("ImpulseSystem", () => {
  let ecs: ECS;
  let impulseSystem: ImpulseSystem;
  beforeEach(() => {
    const mockDataContext = createMockDataContext();
    ecs = new ECS(mockDataContext.server);
    impulseSystem = new ImpulseSystem();
  });
  it("should initialize properly", () => {
    ecs.addSystem(impulseSystem);
    expect(ecs.systems.length).toBe(1);
  });
  it("should properly access an entity with the isImpulseEngines system", () => {
    const entity = new Entity(null, {
      isImpulseEngines: {},
      isShipSystem: {type: "impulseEngines"},
    });
    const ship = new Entity(null, {
      isShip: {},
      mass: {mass: 2000},
      shipSystems: {
        shipSystemIds: [entity.id],
      },
    });
    ecs.addEntity(entity);
    ecs.addEntity(ship);
    ecs.addSystem(impulseSystem);
    const comp = entity.components.isImpulseEngines;
    if (!comp) throw new Error("No isImpulseEngines component");
    expect(comp.targetSpeed).toEqual(0);
    expect(comp.forwardAcceleration).toEqual(0);
    ecs.update(1);
    expect(comp.targetSpeed).toEqual(0);
    expect(comp.forwardAcceleration).toEqual(0);
    entity.updateComponent("isImpulseEngines", {targetSpeed: 500});
    expect(comp.targetSpeed).toEqual(500);
    ecs.update(16);
    expect(comp.forwardAcceleration).toMatchInlineSnapshot(`2.083333333333333`);
    expect(comp.forwardVelocity).toMatchInlineSnapshot(`0.033333333333333326`);
    ecs.update(30 * 1000);

    expect(comp.forwardAcceleration).toMatchInlineSnapshot(`2.083333333333333`);
    expect(comp.forwardVelocity).toMatchInlineSnapshot(`62.533333333333324`);
    entity.updateComponent("isImpulseEngines", {targetSpeed: 5});
    for (let i = 0; i < 60 * 30; i++) {
      ecs.update(16);
    }
    expect(comp.forwardVelocity).toMatchInlineSnapshot(`4.999903669273665`);
    expect(comp.forwardAcceleration).toMatchInlineSnapshot(
      `0.020833333333333336`
    );
    entity.updateComponent("isImpulseEngines", {targetSpeed: 100});
    for (let i = 0; i < 60 * 30; i++) {
      ecs.update(16);
    }
    expect(comp.forwardVelocity).toMatchInlineSnapshot(`16.99990366927301`);
    expect(comp.forwardAcceleration).toMatchInlineSnapshot(
      `0.4166666666666667`
    );
    entity.updateComponent("isImpulseEngines", {targetSpeed: 500});
    for (let i = 0; i < 60 * 30; i++) {
      ecs.update(16);
    }
    expect(comp.forwardAcceleration).toMatchInlineSnapshot(`2.083333333333333`);
    expect(comp.forwardVelocity).toMatchInlineSnapshot(`76.9999036692712`);
  });
});
