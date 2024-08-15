import { DeckNode } from "@server/classes/Plugins/Ship/Deck";
import { createMockDataContext } from "@server/utils/createMockDataContext";
import { ECS, Entity } from "@server/utils/ecs";
import { FilterInventorySystem } from "../FilterInventorySystem";
import { FilterShipsWithReactors } from "../FilterShipsWithReactors";
import { HeatToCoolantSystem } from "../HeatToCoolantSystem";

describe("HeatToCoolantSystem", () => {
	let ecs: ECS;
	let heatToCoolantSystem: HeatToCoolantSystem;
	let filterShipsWithReactorSystem: FilterShipsWithReactors;
	let filterInventorySystem: FilterInventorySystem;
	let coolant: Entity;
	let reactor: Entity;
	let ship: Entity;
	beforeEach(() => {
		const mockDataContext = createMockDataContext();
		ecs = new ECS(mockDataContext.server);
		heatToCoolantSystem = new HeatToCoolantSystem();
		filterShipsWithReactorSystem = new FilterShipsWithReactors();
		filterInventorySystem = new FilterInventorySystem();

		// Set up the initial state for each of the tests
		coolant = new Entity();
		coolant.addComponent("isInventory", {
			volume: 0.001,
			abundance: 1,
			continuous: true,
			flags: { coolant: { massPerUnit: 1, heatCapacity: 4.17 } },
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
			currentOutput: 6,
			outputAssignment: [1, 1, 1, 1, 1, 1],
			maxOutput: 8,
			optimalOutputPercent: 0.7,
		});
		reactor.addComponent("heat", {
			heat: 1200,
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
						Water: {
							count: 100,
							temperature: 300,
						},
					},
				}),
			],
		});
		ship.addComponent("shipSystems");
		ship.components.shipSystems?.shipSystems.set(reactor.id, { roomId: 1 });

		ecs.addEntity(reactor);
		ecs.addEntity(ship);
		ecs.addSystem(filterShipsWithReactorSystem);
		ecs.addSystem(filterInventorySystem);
		ecs.addSystem(heatToCoolantSystem);
	});
	it("should bring the water temperature up to the reactor's temperature", () => {
		if (!reactor.components.isReactor) throw new Error("Not reactor");
		const water = ship.components.shipMap?.deckNodes[0].contents.Water;
		expect(reactor.components.heat?.heat).toMatchInlineSnapshot(`1200`);
		expect(water?.temperature).toMatchInlineSnapshot(`300`);
		for (let i = 0; i < 60; i++) {
			ecs.update(16);
		}
		expect(reactor.components.heat?.heat).toMatchInlineSnapshot(
			`1191.9922564707272`,
		);
		expect(water?.temperature).toMatchInlineSnapshot(`391.2153039905101`);
		for (let i = 0; i < 60 * 60; i++) {
			ecs.update(16);
		}
		expect(reactor.components.heat?.heat).toMatchInlineSnapshot(
			`1127.424395170057`,
		);
		expect(water?.temperature).toMatchInlineSnapshot(`1126.7005346336514`);
	});
	it("should bring the water temperature down to the reactor's temperature", () => {
		if (!reactor.components.isReactor) throw new Error("Not reactor");
		const water = ship.components.shipMap?.deckNodes[0].contents.Water;
		if (water) {
			water.temperature = 1200;
		}
		if (reactor.components.heat) {
			reactor.components.heat.heat = 300;
		}
		expect(reactor.components.heat?.heat).toMatchInlineSnapshot(`300`);
		expect(water?.temperature).toMatchInlineSnapshot(`1200`);
		for (let i = 0; i < 60; i++) {
			ecs.update(16);
		}
		expect(reactor.components.heat?.heat).toMatchInlineSnapshot(
			`308.00774352927226`,
		);
		expect(water?.temperature).toMatchInlineSnapshot(`1108.78469600949`);
		for (let i = 0; i < 60 * 60; i++) {
			ecs.update(16);
		}
		expect(reactor.components.heat?.heat).toMatchInlineSnapshot(
			`372.5756048299453`,
		);
		expect(water?.temperature).toMatchInlineSnapshot(`373.2994653663502`);
	});
	it("more water should lower the reactor's heat faster", () => {
		if (!reactor.components.isReactor) throw new Error("Not reactor");
		const water = ship.components.shipMap?.deckNodes[0].contents.Water;
		if (water) {
			water.count = 1;
			water.temperature = 100;
		}
		if (reactor.components.heat) {
			reactor.components.heat.heat = 1200;
		}
		for (let i = 0; i < 60; i++) {
			ecs.update(16);
		}
		expect(reactor.components.heat?.heat).toMatchInlineSnapshot(
			`1199.0351698356333`,
		);
		expect(water?.temperature).toMatchInlineSnapshot(`1199.0271656452544`);
		if (water) {
			water.count = 1000;
			water.temperature = 100;
		}
		if (reactor.components.heat) {
			reactor.components.heat.heat = 1200;
		}
		for (let i = 0; i < 60; i++) {
			ecs.update(16);
		}
		expect(reactor.components.heat?.heat).toMatchInlineSnapshot(
			`1189.7420382472358`,
		);
		expect(water?.temperature).toMatchInlineSnapshot(`111.68472861525993`);
	});
});
