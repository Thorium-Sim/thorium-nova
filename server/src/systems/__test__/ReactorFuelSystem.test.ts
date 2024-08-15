import { DeckNode } from "@server/classes/Plugins/Ship/Deck";
import { createMockDataContext } from "@server/utils/createMockDataContext";
import { ECS, Entity } from "@server/utils/ecs";
import { getReactorInventory } from "@server/utils/getSystemInventory";
import { FilterInventorySystem } from "../FilterInventorySystem";
import { FilterShipsWithReactors } from "../FilterShipsWithReactors";
import { ReactorFuelSystem } from "../ReactorFuelSystem";

describe("ReactorFuelSystem", () => {
	let ecs: ECS;
	let reactorFuelSystem: ReactorFuelSystem;
	let filterShipsWithReactorSystem: FilterShipsWithReactors;
	let filterInventorySystem: FilterInventorySystem;
	let fuel: Entity;
	let reactor: Entity;
	let ship: Entity;
	beforeEach(() => {
		const mockDataContext = createMockDataContext();
		ecs = new ECS(mockDataContext.server);
		reactorFuelSystem = new ReactorFuelSystem();
		filterShipsWithReactorSystem = new FilterShipsWithReactors();
		filterInventorySystem = new FilterInventorySystem();

		// Set up the initial state for each of the tests
		fuel = new Entity();
		fuel.addComponent("isInventory", {
			volume: 1e-6,
			abundance: 1,
			continuous: true,
			flags: { fuel: { fuelDensity: 14.3 } },
		});
		fuel.addComponent("identity", {
			name: `Deuterium`,
		});

		ecs.addEntity(fuel);

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
		ship.components.shipSystems?.shipSystems.set(reactor.id, { roomId: 1 });

		ecs.addEntity(reactor);
		ecs.addEntity(ship);
		ecs.addSystem(filterShipsWithReactorSystem);
		ecs.addSystem(filterInventorySystem);
		ecs.addSystem(reactorFuelSystem);
	});
	it("should create a list of ships with reactor systems", () => {
		const ship2 = new Entity();
		ship2.addComponent("isShip", {});
		ship2.addComponent("shipSystems");

		ecs.addEntity(ship2);

		expect(filterShipsWithReactorSystem.entities).toHaveLength(1);
		expect(filterShipsWithReactorSystem.entities[0]).toEqual(ship);
	});
	it("should detect the correct amount of items related to a system", () => {
		const fuelList = getReactorInventory(reactor);
		expect(fuelList).toHaveLength(1);
		expect(fuelList?.[0].name).toEqual("Deuterium");
	});
	it("should generate power from the unusedFuel every frame", () => {
		if (!reactor.components.isReactor) throw new Error("not reactor");
		reactor.components.isReactor.unusedFuel = { amount: 0.33, density: 1 };
		if (ship.components.shipMap) {
			ship.components.shipMap.deckNodes[0].contents.Deuterium.count = 0;
		}
		const reactorComponent = reactor.components.isReactor;
		expect(reactorComponent.currentOutput).toMatchInlineSnapshot('6');
		expect(reactorComponent.unusedFuel.amount).toMatchInlineSnapshot(`0.33`);

		for (let i = 0; i < 60; i++) {
			ecs.update(16);
		}
		expect(reactorComponent.currentOutput).toMatchInlineSnapshot('6');
		expect(reactorComponent.unusedFuel.amount).toMatchInlineSnapshot(
			'0.328285714285714',
		);
		for (let i = 0; i < 60 * 9 + 50; i++) {
			ecs.update(16);
		}
		expect(reactorComponent.currentOutput).toMatchInlineSnapshot(
			'6',
		);
		expect(reactorComponent.unusedFuel.amount).toMatchInlineSnapshot('0.31142857142856833');
		ecs.update(16);
		expect(reactorComponent.currentOutput).toMatchInlineSnapshot('6');
		expect(reactorComponent.unusedFuel.amount).toMatchInlineSnapshot('0.3113999999999969');
	});
	it("should consume extra fuel when the desired power is above the optimal level", () => {
		if (!reactor.components.isReactor) throw new Error("not reactor");
		const startingFuel = 0.33;
		reactor.components.isReactor.unusedFuel = {
			amount: startingFuel,
			density: 1,
		};
		const reactorComponent = reactor.components.isReactor;
		reactorComponent.outputAssignment = Array.from({
			length: Math.ceil(
				reactorComponent.maxOutput * reactorComponent.optimalOutputPercent,
			),
		}).map(() => 1);

		for (let i = 0; i < 60; i++) {
			ecs.update(16);
		}
		const fuel1 = reactorComponent.unusedFuel.amount;
		const fuelDiff1 = startingFuel - fuel1;

		reactorComponent.outputAssignment = Array.from({
			length: Math.ceil(reactorComponent.maxOutput),
		});

		for (let i = 0; i < 60; i++) {
			ecs.update(16);
		}
		const fuel2 = reactorComponent.unusedFuel.amount;
		const fuelDiff2 = fuel1 - fuel2;

		expect(fuelDiff1).toBeLessThan(fuelDiff2);

		reactorComponent.outputAssignment = Array.from({
			length: Math.ceil(
				reactorComponent.maxOutput *
					reactorComponent.optimalOutputPercent *
					0.5,
			),
		});

		for (let i = 0; i < 60; i++) {
			ecs.update(16);
		}
		const fuel3 = reactorComponent.unusedFuel.amount;
		const fuelDiff3 = fuel2 - fuel3;
		expect(fuelDiff1).toBeGreaterThan(fuelDiff3);
	});
	it("should use inventory fuel if it ever runs out of regular fuel", () => {
		if (!reactor.components.isReactor) throw new Error("not reactor");
		reactor.components.isReactor.unusedFuel = {
			amount: 0.01,
			density: 1,
		};
		const reactorComponent = reactor.components.isReactor;

		expect(reactorComponent.currentOutput).toMatchInlineSnapshot('6');
		expect(reactorComponent.unusedFuel.amount).toMatchInlineSnapshot(`0.01`);
		expect(
			ship.components.shipMap?.deckNodes[0].contents.Deuterium.count,
		).toMatchInlineSnapshot(`100`);

		for (let i = 0; i < 60; i++) {
			ecs.update(16);
		}
		expect(reactorComponent.currentOutput).toMatchInlineSnapshot('6');
		expect(reactorComponent.unusedFuel.amount).toMatchInlineSnapshot(
			'0.008285714285714311',
		);
		expect(
			ship.components.shipMap?.deckNodes[0].contents.Deuterium.count,
		).toMatchInlineSnapshot('100');
	});
});
