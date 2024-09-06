import { DeckNode } from "@server/classes/Plugins/Ship/Deck";
import { createMockDataContext } from "@server/utils/createMockDataContext";
import { ECS, Entity } from "@server/utils/ecs";
import { FilterInventorySystem } from "../FilterInventorySystem";
import { FilterShipsWithReactors } from "../FilterShipsWithReactors";
import { HeatDispersionSystem } from "../HeatDispersionSystem";

describe("HeatDispersionSystem", () => {
	let ecs: ECS;
	let heatDispersionSystem: HeatDispersionSystem;
	let filterShipsWithReactorSystem: FilterShipsWithReactors;
	let filterInventorySystem: FilterInventorySystem;
	let coolant: Entity;
	let reactor: Entity;
	let ship: Entity;
	beforeEach(() => {
		const mockDataContext = createMockDataContext();
		ecs = new ECS(mockDataContext.server);
		heatDispersionSystem = new HeatDispersionSystem();
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
						Water: {
							count: 100,
							temperature: 1000,
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
		ecs.addSystem(heatDispersionSystem);
	});
	it("should disperse heat out into space", () => {
		if (!reactor.components.isReactor) throw new Error("Not reactor");
		const heatComponent = reactor.components.heat;
		// One second
		expect(
			ship.components.shipMap?.deckNodes[0].contents.Water.temperature,
		).toMatchInlineSnapshot(`1000`);
		for (let i = 0; i < 60; i++) {
			ecs.update(16);
		}
		expect(
			ship.components.shipMap?.deckNodes[0].contents.Water.temperature,
		).toMatchInlineSnapshot(`899.9549085464537`);
	});
});
