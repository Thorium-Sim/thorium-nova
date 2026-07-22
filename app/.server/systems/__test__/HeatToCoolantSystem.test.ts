import { DeckNode } from "@thorium/.server/classes/Plugins/Ship/Deck";
import { thoriumContext } from "@thorium/utils/.server/context";
import { createMockDataContext } from "@thorium/utils/.server/createMockDataContext";
import { testDataStoreProps } from "@thorium/utils/.server/db-fs/testDataStoreProps";
import { ECS, Entity } from "@thorium/utils/ecs";
import { describe, expect, it, beforeEach, aroundEach } from "vitest";

import { FilterInventorySystem } from "../FilterInventorySystem";
import { FilterShipsWithReactors } from "../FilterShipsWithReactors";
import { HeatToCoolantSystem } from "../HeatToCoolantSystem";

aroundEach(async (runTest) => {
	await thoriumContext.run(testDataStoreProps, async () => {
		await runTest();
	});
});

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

		expect(reactor.components.heat?.heat).toMatchInlineSnapshot(`1200`);

		for (let i = 0; i < 60; i++) {
			ecs.update(16);
		}
		expect(reactor.components.heat?.heat).toMatchInlineSnapshot(`1191.9922564707272`);

		for (let i = 0; i < 60 * 60; i++) {
			ecs.update(16);
		}
		expect(reactor.components.heat?.heat).toMatchInlineSnapshot(`1127.424395170057`);
	});
	it("should bring the water temperature down to the reactor's temperature", () => {
		if (!reactor.components.isReactor) throw new Error("Not reactor");

		if (reactor.components.heat) {
			reactor.components.heat.heat = 300;
		}
		expect(reactor.components.heat?.heat).toMatchInlineSnapshot(`300`);

		for (let i = 0; i < 60; i++) {
			ecs.update(16);
		}
		expect(reactor.components.heat?.heat).toMatchInlineSnapshot(`308.00774352927226`);

		for (let i = 0; i < 60 * 60; i++) {
			ecs.update(16);
		}
		expect(reactor.components.heat?.heat).toMatchInlineSnapshot(`372.5756048299453`);
	});
	it("more water should lower the reactor's heat faster", () => {
		if (!reactor.components.isReactor) throw new Error("Not reactor");
		const water = ship.components.shipMap?.deckNodes[0].contents.Water;
		if (water) {
			water.count = 1;
		}
		if (reactor.components.heat) {
			reactor.components.heat.heat = 1200;
		}
		for (let i = 0; i < 60; i++) {
			ecs.update(16);
		}
		expect(reactor.components.heat?.heat).toMatchInlineSnapshot(`1199.0351698356333`);

		if (water) {
			water.count = 1000;
		}
		if (reactor.components.heat) {
			reactor.components.heat.heat = 1200;
		}
		for (let i = 0; i < 60; i++) {
			ecs.update(16);
		}
		expect(reactor.components.heat?.heat).toMatchInlineSnapshot(`1189.7420382472358`);
	});
});
