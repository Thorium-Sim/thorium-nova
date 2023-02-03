import {createMockDataContext} from "server/src/utils/createMockDataContext";
import {ECS, Entity} from "server/src/utils/ecs";
import {AutoThrustSystem} from "../AutoThrustSystem";
import {EngineVelocityPosition} from "../EngineVelocityPosition";
import {EngineVelocitySystem} from "../EngineVelocitySystem";
import {ImpulseSystem} from "../ImpulseSystem";
import {PositionVelocitySystem} from "../PositionVelocitySystem";
import {WarpSystem} from "../WarpSystem";

describe.skip("AutoThrustSystem", () => {
  let ecs: ECS;
  let autoThrustSystem: AutoThrustSystem;
  let impulseSystem: ImpulseSystem;
  let warpSystem: WarpSystem;
  let engineVelocitySystem: EngineVelocitySystem;
  let engineVelocityPosition: EngineVelocityPosition;
  let positionVelocitySystem: PositionVelocitySystem;

  let ship: Entity;
  let dampening: Entity;
  let warp: Entity;
  let impulse: Entity;
  let system: Entity;
  beforeEach(() => {
    const mockDataContext = createMockDataContext();
    ecs = new ECS(mockDataContext.server);
    autoThrustSystem = new AutoThrustSystem();
    impulseSystem = new ImpulseSystem();
    warpSystem = new WarpSystem();
    engineVelocitySystem = new EngineVelocitySystem();
    engineVelocityPosition = new EngineVelocityPosition();
    positionVelocitySystem = new PositionVelocitySystem();

    ecs.addSystem(autoThrustSystem);
    ecs.addSystem(impulseSystem);
    ecs.addSystem(warpSystem);
    ecs.addSystem(engineVelocitySystem);
    ecs.addSystem(engineVelocityPosition);
    ecs.addSystem(positionVelocitySystem);

    dampening = new Entity(null, {
      isInertialDampeners: {},
      isShipSystem: {type: "inertialDampeners"},
    });
    ecs.addEntity(dampening);

    warp = new Entity();
    warp.addComponent("isWarpEngines");
    warp.addComponent("isShipSystem");
    ecs.addEntity(warp);

    impulse = new Entity();
    impulse.addComponent("isImpulseEngines");
    impulse.addComponent("isShipSystem");
    ecs.addEntity(impulse);

    system = new Entity(3);
    system.addComponent("isSolarSystem");
    system.addComponent("position");
    ecs.addEntity(system);

    ship = new Entity(100, {
      isShip: {},
      mass: {mass: 2000},
      position: {type: "solar", parentId: system.id},
      velocity: {},
      rotation: {},
      rotationVelocity: {},
      autopilot: {},
      shipSystems: {
        shipSystems: new Map([
          [dampening.id, {}],
          [warp.id, {}],
          [impulse.id, {}],
        ]),
      },
    });
    ecs.addEntity(ship);
  });
  it("should move the ship forward towards its destination using impulse engines", () => {
    expect(ship.components.position?.z).toMatchInlineSnapshot(`0`);
    ship.updateComponent("autopilot", {
      desiredCoordinates: {x: 0, y: 0, z: 20},
      desiredSolarSystemId: null,
      forwardAutopilot: true,
      rotationAutopilot: true,
    });

    ecs.update(1000 / 60);

    expect(
      impulse.components.isImpulseEngines?.targetSpeed.toFixed()
    ).toMatchInlineSnapshot(`"735"`);
    for (let i = 0; i < 60; i++) {
      ecs.update(1000 / 60);
    }
    expect(ship.components.position?.z).toBeGreaterThanOrEqual(0.4);
    expect(ship.components.position?.z).toBeLessThan(0.6);
    for (let i = 0; i < 60; i++) {
      ecs.update(1000 / 60);
    }
    expect(ship.components.position?.z).toBeGreaterThan(0);
    expect(ship.components.position?.z).toBeLessThan(3);
    for (let i = 0; i < 60 * 10; i++) {
      ecs.update(1000 / 60);
    }
    expect(
      impulse.components.isImpulseEngines?.targetSpeed.toFixed()
    ).toMatchInlineSnapshot(`"0"`);
    expect(Math.floor(ship.components.position?.z || 0)).toMatchInlineSnapshot(
      `15`
    );
  });
  it("should move the ship forward towards a further destination using impulse engines", () => {
    expect(ship.components.position?.z).toMatchInlineSnapshot(`0`);
    ship.updateComponent("autopilot", {
      desiredCoordinates: {x: 0, y: 0, z: 200},
      desiredSolarSystemId: null,
      forwardAutopilot: true,
      rotationAutopilot: true,
    });

    ecs.update(1000 / 60);

    expect(
      impulse.components.isImpulseEngines?.targetSpeed.toFixed()
    ).toMatchInlineSnapshot(`"1500"`);

    for (let i = 0; i < 60; i++) {
      ecs.update(1000 / 60);
    }
    expect(ship.components.position?.z).toBeGreaterThan(3);
    expect(ship.components.position?.z).toBeLessThan(4);
    for (let i = 0; i < 60; i++) {
      ecs.update(1000 / 60);
    }
    expect(ship.components.position?.z).toBeGreaterThan(9);
    expect(ship.components.position?.z).toBeLessThan(12);
    for (let i = 0; i < 60 * 12; i++) {
      ecs.update(1000 / 60);
    }
    expect(
      impulse.components.isImpulseEngines?.targetSpeed.toFixed()
    ).toMatchInlineSnapshot(`"0"`);
    expect(ship.components.position?.z).toBeGreaterThan(165);
    expect(ship.components.position?.z).toBeLessThan(205);
  });
  it("should move the ship forward towards a destination using warp engines", () => {
    expect(ship.components.position?.z).toMatchInlineSnapshot(`0`);
    ship.updateComponent("autopilot", {
      desiredCoordinates: {x: 0, y: 0, z: 50_000},
      desiredSolarSystemId: null,
      forwardAutopilot: true,
      rotationAutopilot: true,
    });

    ecs.update(1000 / 60);

    expect(
      impulse.components.isImpulseEngines?.targetSpeed.toFixed()
    ).toMatchInlineSnapshot(`"0"`);

    expect(warp.components.isWarpEngines?.maxVelocity).toMatchInlineSnapshot(
      `1305004.9999999995`
    );
    expect(
      warp.components.isWarpEngines?.currentWarpFactor
    ).toMatchInlineSnapshot(`1.1758754994912433`);

    for (let i = 0; i < 60; i++) {
      ecs.update(1000 / 60);
    }

    expect(ship.components.position?.z).toBeGreaterThan(30000);
    expect(ship.components.position?.z).toBeLessThan(33000);

    for (let i = 0; i < 60; i++) {
      ecs.update(1000 / 60);
    }

    expect(warp.components.isWarpEngines?.maxVelocity).toMatchInlineSnapshot(
      `0`
    );
    expect(
      warp.components.isWarpEngines?.currentWarpFactor
    ).toMatchInlineSnapshot(`0`);

    expect(
      impulse.components.isImpulseEngines?.targetSpeed
    ).toMatchInlineSnapshot(`1500`);

    expect(ship.components.position?.z).toBeGreaterThan(36500);
    expect(ship.components.position?.z).toBeLessThan(40000);

    for (let i = 0; i < 60 * 90; i++) {
      ecs.update(1000 / 60);
    }

    expect(ship.components.position?.z).toBeGreaterThan(48000);
    expect(ship.components.position?.z).toBeLessThan(51000);
    expect(impulse.components.isImpulseEngines?.targetSpeed).toEqual(0);
  });
});
