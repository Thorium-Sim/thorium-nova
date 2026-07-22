import { DeckNode } from "@thorium/.server/classes/Plugins/Ship/Deck";
import { thoriumContext } from "@thorium/utils/.server/context";
import { createMockDataContext } from "@thorium/utils/.server/createMockDataContext";
import { testDataStoreProps } from "@thorium/utils/.server/db-fs/testDataStoreProps";
import { executeBlocks } from "@thorium/utils/.server/executeBlocks";
import { processTriggers } from "@thorium/utils/.server/processTriggers";
import { ECS, Entity } from "@thorium/utils/ecs";
import { aroundEach, beforeEach, describe, expect, it } from "vitest";

import { FilterInventorySystem } from "../FilterInventorySystem";
import { FilterShipsWithReactors } from "../FilterShipsWithReactors";
import { HeatDispersionSystem } from "../HeatDispersionSystem";
import { HeatToCoolantSystem } from "../HeatToCoolantSystem";
import { ReactorHeatSystem } from "../ReactorHeatSystem";

aroundEach(async (runTest) => {
	await thoriumContext.run(testDataStoreProps, async () => {
		await runTest();
	});
});

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
		ecs.executeBlocks = (blocks, blockMetadata) => executeBlocks(ecs, blocks, blockMetadata);
		ecs.processTriggers = (events) => processTriggers(ecs, events);
		reactorHeatSystem = new ReactorHeatSystem();
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
			heat: 300,
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
		expect(heatComponent?.heat).toMatchInlineSnapshot(`300.01091368421044`);

		// One minute
		for (let i = 0; i < 60 * 60; i++) {
			ecs.update(16);
		}
		expect(heatComponent?.heat).toMatchInlineSnapshot(`300.6657347368366`);
	});
	it("should transfer some of the heat into the coolant", () => {
		const heatToCoolantSystem = new HeatToCoolantSystem();
		ecs.addSystem(heatToCoolantSystem);
		if (ship.components.shipMap) {
			ship.components.shipMap.deckNodes[0].contents.Water = {
				count: 1000,
			};
		}

		const heatComponent = reactor.components.heat;

		expect(heatComponent?.heat).toMatchInlineSnapshot(`300`);
		// One second
		for (let i = 0; i < 60; i++) {
			ecs.update(16);
		}
		expect(heatComponent?.heat).toMatchInlineSnapshot(`300.0108617779006`);

		// One minute
		for (let i = 0; i < 60 * 60; i++) {
			ecs.update(16);
		}
		expect(heatComponent?.heat).toMatchInlineSnapshot(`300.5336132852704`);
	});
	it("should disperse some of the coolant's heat into space", () => {
		const heatToCoolantSystem = new HeatToCoolantSystem();
		ecs.addSystem(heatToCoolantSystem);
		const heatDispersionSystem = new HeatDispersionSystem();
		ecs.addSystem(heatDispersionSystem);

		if (ship.components.shipMap) {
			ship.components.shipMap.deckNodes[0].contents.Water = {
				count: 1000,
			};
		}

		const heatComponent = reactor.components.heat;

		expect(heatComponent?.heat).toMatchInlineSnapshot(`300`);

		// One second
		for (let i = 0; i < 60; i++) {
			ecs.update(16);
		}
		expect(heatComponent?.heat).toMatchInlineSnapshot(`300.0107158633319`);

		// One minute
		for (let i = 0; i < 60 * 60; i++) {
			ecs.update(16);
		}
		expect(heatComponent?.heat).toMatchInlineSnapshot(`300.1534015618128`);
		// Test turning off the reactor
		if (reactor.components.isReactor) {
			reactor.components.isReactor.currentOutput = 0;
		}
		for (let i = 0; i < 60 * 60; i++) {
			ecs.update(16);
		}
		expect(heatComponent?.heat).toMatchInlineSnapshot(`299.30451177402915`);
	});
});
