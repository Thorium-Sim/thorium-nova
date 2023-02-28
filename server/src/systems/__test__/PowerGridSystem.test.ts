import {createMockDataContext} from "@server/utils/createMockDataContext";
import {ECS, Entity} from "@server/utils/ecs";
import {randomFromList} from "@server/utils/randomFromList";
import {PowerGridSystem} from "../PowerGridSystem";

describe("PowerGridSystem", () => {
  let ecs: ECS;
  let ship: Entity;
  beforeEach(() => {
    const mockDataContext = createMockDataContext();

    ecs = new ECS(mockDataContext.server);
    ecs.addSystem(new PowerGridSystem());
    ship = new Entity();
    ship.addComponent("isShip");
    ship.addComponent("shipSystems");
    ecs.addEntity(ship);
  });
  it("should work with a simple setup", () => {
    const system = new Entity();
    system.addComponent("isShipSystem", {type: "generic"});
    system.addComponent("power", {requestedPower: 50, currentPower: 0});
    ship.components.shipSystems?.shipSystems.set(system.id, {});
    ecs.addEntity(system);

    const powerNode = new Entity();
    powerNode.addComponent("isPowerNode", {
      maxConnections: 3,
      connectedSystems: [system.id],
    });
    ship.components.shipSystems?.shipSystems.set(powerNode.id, {});
    ecs.addEntity(powerNode);

    const reactor = new Entity();
    reactor.addComponent("isShipSystem", {type: "reactor"});
    reactor.addComponent("isReactor", {
      currentOutput: 60,
      connectedEntities: [powerNode.id],
    });
    ship.components.shipSystems?.shipSystems.set(reactor.id, {});
    ecs.addEntity(reactor);

    expect(system.components.power?.currentPower).toEqual(0);

    ecs.update(16);
    expect(system.components.power?.currentPower).toEqual(50);

    reactor.updateComponent("isReactor", {currentOutput: 10});
    ecs.update(16);
    expect(system.components.power?.currentPower).toEqual(10);

    system.updateComponent("power", {requestedPower: 5});
    ecs.update(16);
    expect(system.components.power?.currentPower).toEqual(5);
  });

  it("should properly distribute power from a single reactor to multiple systems", () => {
    const system1 = new Entity();
    system1.addComponent("isShipSystem", {type: "generic"});
    system1.addComponent("power", {requestedPower: 50, currentPower: 0});
    ship.components.shipSystems?.shipSystems.set(system1.id, {});
    ecs.addEntity(system1);
    const system2 = new Entity();
    system2.addComponent("isShipSystem", {type: "generic"});
    system2.addComponent("power", {requestedPower: 50, currentPower: 0});
    ship.components.shipSystems?.shipSystems.set(system2.id, {});
    ecs.addEntity(system2);

    const powerNode = new Entity();
    powerNode.addComponent("isPowerNode", {
      maxConnections: 3,
      connectedSystems: [system1.id, system2.id],
    });
    ship.components.shipSystems?.shipSystems.set(powerNode.id, {});
    ecs.addEntity(powerNode);

    const reactor = new Entity();
    reactor.addComponent("isShipSystem", {type: "reactor"});
    reactor.addComponent("isReactor", {
      currentOutput: 60,
      connectedEntities: [powerNode.id],
    });
    ship.components.shipSystems?.shipSystems.set(reactor.id, {});
    ecs.addEntity(reactor);

    ecs.update(16);
    expect(system1.components.power?.currentPower).toEqual(30);
    expect(system2.components.power?.currentPower).toEqual(30);

    system1.updateComponent("power", {requestedPower: 10});
    ecs.update(16);
    expect(system1.components.power?.currentPower).toEqual(10);
    expect(system2.components.power?.currentPower).toEqual(50);

    powerNode.updateComponent("isPowerNode", {distributionMode: "leastFirst"});
    reactor.updateComponent("isReactor", {currentOutput: 15});
    ecs.update(16);
    expect(system1.components.power?.currentPower).toEqual(10);
    expect(system2.components.power?.currentPower).toEqual(5);

    powerNode.updateComponent("isPowerNode", {distributionMode: "mostFirst"});
    ecs.update(16);
    expect(system1.components.power?.currentPower).toEqual(0);
    expect(system2.components.power?.currentPower).toEqual(15);
  });
  it("should work with multiple reactors connected to multiple power nodes", () => {
    const system1 = new Entity();
    system1.addComponent("isShipSystem", {type: "generic"});
    system1.addComponent("power", {requestedPower: 50, currentPower: 0});
    ship.components.shipSystems?.shipSystems.set(system1.id, {});
    ecs.addEntity(system1);
    const system2 = new Entity();
    system2.addComponent("isShipSystem", {type: "generic"});
    system2.addComponent("power", {requestedPower: 50, currentPower: 0});
    ship.components.shipSystems?.shipSystems.set(system2.id, {});
    ecs.addEntity(system2);
    const system3 = new Entity();
    system3.addComponent("isShipSystem", {type: "generic"});
    system3.addComponent("power", {requestedPower: 50, currentPower: 0});
    ship.components.shipSystems?.shipSystems.set(system3.id, {});
    ecs.addEntity(system3);
    const system4 = new Entity();
    system4.addComponent("isShipSystem", {type: "generic"});
    system4.addComponent("power", {requestedPower: 50, currentPower: 0});
    ship.components.shipSystems?.shipSystems.set(system4.id, {});
    ecs.addEntity(system4);

    const powerNode1 = new Entity();
    powerNode1.addComponent("isPowerNode", {
      maxConnections: 3,
      connectedSystems: [system1.id, system2.id],
    });
    ship.components.shipSystems?.shipSystems.set(powerNode1.id, {});
    ecs.addEntity(powerNode1);
    const powerNode2 = new Entity();
    powerNode2.addComponent("isPowerNode", {
      maxConnections: 3,
      connectedSystems: [system3.id, system4.id],
    });
    ship.components.shipSystems?.shipSystems.set(powerNode2.id, {});
    ecs.addEntity(powerNode2);

    const reactor = new Entity();
    reactor.addComponent("isShipSystem", {type: "reactor"});
    reactor.addComponent("isReactor", {
      currentOutput: 60,
      connectedEntities: [powerNode1.id, powerNode2.id],
    });
    ship.components.shipSystems?.shipSystems.set(reactor.id, {});
    ecs.addEntity(reactor);

    ecs.update(16);
    expect(system1.components.power?.currentPower).toEqual(15);
    expect(system2.components.power?.currentPower).toEqual(15);
    expect(system3.components.power?.currentPower).toEqual(15);
    expect(system4.components.power?.currentPower).toEqual(15);

    const reactor2 = new Entity();
    reactor2.addComponent("isShipSystem", {type: "reactor"});
    reactor2.addComponent("isReactor", {
      currentOutput: 60,
      connectedEntities: [powerNode2.id],
    });
    ship.components.shipSystems?.shipSystems.set(reactor2.id, {});
    ecs.addEntity(reactor2);

    ecs.update(16);
    expect(system1.components.power?.currentPower).toEqual(15);
    expect(system2.components.power?.currentPower).toEqual(15);
    expect(system3.components.power?.currentPower).toEqual(45);
    expect(system4.components.power?.currentPower).toEqual(45);

    system1.updateComponent("power", {requestedPower: 10});
    system2.updateComponent("power", {requestedPower: 10});

    ecs.update(16);
    expect(system1.components.power?.currentPower).toEqual(10);
    expect(system2.components.power?.currentPower).toEqual(10);
    expect(system3.components.power?.currentPower).toEqual(50);
    expect(system4.components.power?.currentPower).toEqual(50);

    system1.updateComponent("power", {requestedPower: 50});
    system2.updateComponent("power", {requestedPower: 50});
    system3.updateComponent("power", {requestedPower: 10});
    system4.updateComponent("power", {requestedPower: 10});

    ecs.update(16);
    expect(system1.components.power?.currentPower).toEqual(30);
    expect(system2.components.power?.currentPower).toEqual(30);
    expect(system3.components.power?.currentPower).toEqual(10);
    expect(system4.components.power?.currentPower).toEqual(10);
  });
  it("should properly charge and discharge batteries", () => {
    const system = new Entity();
    system.addComponent("isShipSystem", {type: "generic"});
    system.addComponent("power", {requestedPower: 50, currentPower: 0});
    ship.components.shipSystems?.shipSystems.set(system.id, {});
    ecs.addEntity(system);

    const powerNode = new Entity();
    powerNode.addComponent("isPowerNode", {
      maxConnections: 3,
      connectedSystems: [system.id],
    });
    ship.components.shipSystems?.shipSystems.set(powerNode.id, {});
    ecs.addEntity(powerNode);

    const battery = new Entity();
    battery.addComponent("isShipSystem", {type: "battery"});
    battery.addComponent("isBattery", {
      connectedNodes: [powerNode.id],
      storage: 0,
    });
    ship.components.shipSystems?.shipSystems.set(battery.id, {});
    ecs.addEntity(battery);

    const reactor = new Entity();
    reactor.addComponent("isShipSystem", {type: "reactor"});
    reactor.addComponent("isReactor", {
      currentOutput: 30,
      connectedEntities: [battery.id],
    });
    ship.components.shipSystems?.shipSystems.set(reactor.id, {});
    ecs.addEntity(reactor);

    expect(battery.components.isBattery?.storage).toEqual(0);
    ecs.update(16);
    expect(battery.components.isBattery?.storage).toMatchInlineSnapshot(
      `0.00013333333333333334`
    );
    reactor.updateComponent("isReactor", {currentOutput: 180});
    battery.updateComponent("isBattery", {storage: 0});
    ecs.update(16);
    const storage = battery.components.isBattery?.storage;
    reactor.updateComponent("isReactor", {currentOutput: 500});
    battery.updateComponent("isBattery", {storage: 0});
    ecs.update(16);
    expect(storage).toMatchInlineSnapshot(`0.0008000000000000001`);
    expect(storage).toEqual(battery.components.isBattery?.storage);

    // It should take 16 minutes to fully charge a battery at this rate.
    for (let i = 0; i < 60 * 60 * 16; i++) {
      ecs.update(16);
    }
    expect(battery.components.isBattery?.storage).toMatchInlineSnapshot(`46`);

    reactor.updateComponent("isReactor", {
      currentOutput: 50,
      connectedEntities: [battery.id, powerNode.id],
    });
    battery.updateComponent("isBattery", {storage: 10});
    for (let i = 0; i < 60; i++) {
      ecs.update(16);
    }
    expect(battery.components.isBattery?.storage).toEqual(10);
    reactor.updateComponent("isReactor", {
      currentOutput: 30,
      connectedEntities: [battery.id, powerNode.id],
    });
    battery.updateComponent("isBattery", {storage: 10});
    ecs.update(16);
    expect(battery.components.isBattery?.storage).toEqual(9.99991111111111);
    for (let i = 0; i < 60; i++) {
      ecs.update(16);
    }
    expect(battery.components.isBattery?.storage).toEqual(9.994577777777742);
  });
  it("should perform decently well", () => {
    const reactors = Array.from({length: 5}).map(() => {
      const reactor = new Entity();
      reactor.addComponent("isShipSystem", {type: "reactor"});
      reactor.addComponent("isReactor", {
        currentOutput: 60,
        connectedEntities: [],
      });
      ship.components.shipSystems?.shipSystems.set(reactor.id, {});
      ecs.addEntity(reactor);
      return reactor;
    });
    const powerNodes = Array.from({length: 5}).map(() => {
      const powerNode = new Entity();
      powerNode.addComponent("isPowerNode", {
        maxConnections: 3,
        connectedSystems: [],
        distributionMode: randomFromList([
          "evenly",
          "leastNeed",
          "mostNeed",
        ]) as any,
      });
      ship.components.shipSystems?.shipSystems.set(powerNode.id, {});
      ecs.addEntity(powerNode);
      const nodeReactors = new Set<Entity>();

      nodeReactors.add(randomFromList(reactors));
      nodeReactors.add(randomFromList(reactors));
      nodeReactors.forEach(reactor => {
        reactor.updateComponent("isReactor", {
          connectedEntities: [
            ...(reactor.components.isReactor?.connectedEntities || []),
            powerNode.id,
          ],
        });
      });
      return powerNode;
    });

    Array.from({length: 4}).map(() => {
      const battery = new Entity();
      battery.addComponent("isShipSystem", {type: "battery"});
      const nodeSet = new Set<Entity>();
      nodeSet.add(randomFromList(powerNodes));
      nodeSet.add(randomFromList(powerNodes));
      battery.addComponent("isBattery", {
        connectedNodes: [...nodeSet.values()].map(n => n.id),
        storage: 0,
      });
      const reactorSet = new Set<Entity>();
      reactorSet.add(randomFromList(reactors));
      reactorSet.add(randomFromList(reactors));
      reactorSet.forEach(reactor => {
        reactor.updateComponent("isReactor", {
          connectedEntities: [
            ...(reactor.components.isReactor?.connectedEntities || []),
            battery.id,
          ],
        });
      });
      ship.components.shipSystems?.shipSystems.set(battery.id, {});
      ecs.addEntity(battery);
      return battery;
    });
    Array.from({length: 50}).map(() => {
      const system = new Entity();
      system.addComponent("isShipSystem", {type: "generic"});
      system.addComponent("power", {
        requestedPower: Math.random() * 100,
        currentPower: 0,
      });
      ship.components.shipSystems?.shipSystems.set(system.id, {});
      ecs.addEntity(system);

      const node = randomFromList(powerNodes);
      node.updateComponent("isPowerNode", {
        connectedSystems: [
          ...(node.components.isPowerNode?.connectedSystems || []),
          system.id,
        ],
      });
      return system;
    });

    const time = performance.now();
    ecs.update(16);
    expect(performance.now() - time).toBeLessThan(1);
  });
});
