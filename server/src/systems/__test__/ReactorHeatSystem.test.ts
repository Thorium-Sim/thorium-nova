import {DeckNode} from "@server/classes/Plugins/Ship/Deck";
import {createMockDataContext} from "@server/utils/createMockDataContext";
import {ECS, Entity} from "@server/utils/ecs";
import {getReactorInventory} from "@server/utils/getSystemInventory";
import {FilterInventorySystem} from "../FilterInventorySystem";
import {FilterShipsWithReactors} from "../FilterShipsWithReactors";
import {HeatDispersionSystem} from "../HeatDispersionSystem";
import {HeatToCoolantSystem} from "../HeatToCoolantSystem";
import {ReactorHeatSystem} from "../ReactorHeatSystem";

describe("ReactorHeatSystem", () => {
  let ecs: ECS;
  let reactorHeatSystem: ReactorHeatSystem;
  let filterShipsWithReactorSystem: FilterShipsWithReactors;
  let filterInventorySystem: FilterInventorySystem;
  let coolant: Entity;
  let reactor: Entity;
  let ship: Entity;
  beforeEach(() => {
    const mockDataContext = createMockDataContext();
    ecs = new ECS(mockDataContext.server);
    reactorHeatSystem = new ReactorHeatSystem();
    filterShipsWithReactorSystem = new FilterShipsWithReactors();
    filterInventorySystem = new FilterInventorySystem();

    // Set up the initial state for each of the tests
    coolant = new Entity();
    coolant.addComponent("isInventory", {
      volume: 0.001,
      abundance: 1,
      continuous: true,
      flags: {coolant: {massPerUnit: 1, heatCapacity: 4.17}},
    });
    coolant.addComponent("identity", {
      name: `Water`,
    });

    ecs.addEntity(coolant);

    reactor = new Entity();
    reactor.addComponent("isShipSystem", {
      type: "reactor",
    });
    reactor.addComponent("isReactor", {
      currentOutput: 120,
      desiredOutput: 120,
      maxOutput: 180,
      optimalOutputPercent: 0.7,
    });
    reactor.addComponent("heat", {
      heat: 300,
      heatDissipationRate: 1,
      powerToHeat: 0.01,
      nominalHeat: 300,
      maxSafeHeat: 400,
      maxHeat: 500,
    });
    ship = new Entity();
    ship.addComponent("isShip", {});
    ship.addComponent("shipMap", {
      decks: [
        {
          name: "Deck 1",
          backgroundUrl: "",
        },
      ],
      deckNodes: [
        new DeckNode({
          id: 1,
          deckIndex: 0,
          x: 0,
          y: 0,
          systems: ["reactor"],
          isRoom: true,
          contents: {
            Deuterium: {
              count: 100,
              temperature: 295.37,
            },
          },
        }),
      ],
    });
    ship.addComponent("shipSystems");
    ship.components.shipSystems?.shipSystems.set(reactor.id, {roomId: 1});

    ecs.addEntity(reactor);
    ecs.addEntity(ship);
    ecs.addSystem(filterShipsWithReactorSystem);
    ecs.addSystem(filterInventorySystem);
    ecs.addSystem(reactorHeatSystem);
  });
  it("should heat up the reactor in the absence of coolant", () => {
    if (!reactor.components.isReactor) throw new Error("Not reactor");
    const heatComponent = reactor.components.heat;
    // One second
    expect(heatComponent?.heat).toEqual(300);
    for (let i = 0; i < 60; i++) {
      ecs.update(16);
    }
    expect(heatComponent?.heat).toMatchInlineSnapshot(`300.2425263157909`);

    // One minute
    for (let i = 0; i < 60 * 60; i++) {
      ecs.update(16);
    }
    expect(heatComponent?.heat).toMatchInlineSnapshot(`314.79410526324386`);
  });
  it("should transfer some of the heat into the coolant", () => {
    const heatToCoolantSystem = new HeatToCoolantSystem();
    ecs.addSystem(heatToCoolantSystem);
    if (ship.components.shipMap) {
      ship.components.shipMap.deckNodes[0].contents.Water = {
        count: 1000,
        temperature: 300,
      };
    }

    const water = ship.components.shipMap?.deckNodes[0].contents.Water;
    const heatComponent = reactor.components.heat;

    expect(water?.temperature).toMatchInlineSnapshot(`300`);
    expect(heatComponent?.heat).toMatchInlineSnapshot(`300`);
    // One second
    for (let i = 0; i < 60; i++) {
      ecs.update(16);
    }
    expect(water?.temperature).toMatchInlineSnapshot(`300.0013139087228`);
    expect(heatComponent?.heat).toMatchInlineSnapshot(`300.24137284223843`);

    // One minute
    for (let i = 0; i < 60 * 60; i++) {
      ecs.update(16);
    }
    expect(water?.temperature).toMatchInlineSnapshot(`303.3444012519671`);
    expect(heatComponent?.heat).toMatchInlineSnapshot(`311.858073006254`);
  });
  it("should disperse some of the coolant's heat into space", () => {
    const heatToCoolantSystem = new HeatToCoolantSystem();
    ecs.addSystem(heatToCoolantSystem);
    const heatDispersionSystem = new HeatDispersionSystem();
    ecs.addSystem(heatDispersionSystem);

    if (ship.components.shipMap) {
      ship.components.shipMap.deckNodes[0].contents.Water = {
        count: 1000,
        temperature: 300,
      };
    }

    const water = ship.components.shipMap?.deckNodes[0].contents.Water;
    const heatComponent = reactor.components.heat;

    expect(water?.temperature).toMatchInlineSnapshot(`300`);
    expect(heatComponent?.heat).toMatchInlineSnapshot(`300`);

    // One second
    for (let i = 0; i < 60; i++) {
      ecs.update(16);
    }
    expect(water?.temperature).toMatchInlineSnapshot(`299.96976663913847`);
    expect(heatComponent?.heat).toMatchInlineSnapshot(`300.2412269271415`);

    // One minute
    for (let i = 0; i < 60 * 60; i++) {
      ecs.update(16);
    }
    expect(water?.temperature).toMatchInlineSnapshot(`301.8342184058807`);
    expect(heatComponent?.heat).toMatchInlineSnapshot(`311.4734007014108`);
    // Test turning off the reactor
    if (reactor.components.isReactor) {
      reactor.components.isReactor.currentOutput = 0;
    }
    for (let i = 0; i < 60 * 60; i++) {
      ecs.update(16);
    }
    expect(water?.temperature).toMatchInlineSnapshot(`303.8757180028086`);
    expect(heatComponent?.heat).toMatchInlineSnapshot(`307.92052500643865`);
  });
});
