import { PowerDistributionSystem } from "@server/systems/PowerDistributionSystem";
import { createMockDataContext } from "@server/utils/createMockDataContext";
import { ECS, Entity } from "@server/utils/ecs";
import { randomFromList } from "@server/utils/randomFromList";

describe("PowerDistributionSystem", () => {
	let ecs: ECS;
	let ship: Entity;
	beforeEach(() => {
		const mockDataContext = createMockDataContext();

		ecs = new ECS(mockDataContext.server);
		ecs.addSystem(new PowerDistributionSystem());
		ship = new Entity();
		ship.addComponent("isShip");
		ship.addComponent("shipSystems");
		ecs.addEntity(ship);
	});
	it("should work with a simple setup", () => {
		const reactor = new Entity();
		reactor.addComponent("isShipSystem", { type: "reactor" });
		reactor.addComponent("isReactor", {
			currentOutput: 6,
		});
		ship.components.shipSystems?.shipSystems.set(reactor.id, {});
		ecs.addEntity(reactor);

		const system = new Entity();
		system.addComponent("isShipSystem", { type: "generic" });
		system.addComponent("power", {
			powerDraw: 4,
			currentPower: 0,
			powerSources: [reactor.id, reactor.id, reactor.id, reactor.id],
		});
		ship.components.shipSystems?.shipSystems.set(system.id, {});
		ecs.addEntity(system);

		expect(system.components.power?.currentPower).toEqual(0);

		ecs.update(16);
		expect(system.components.power?.currentPower).toEqual(4);

		system.updateComponent("power", {
			powerSources: [reactor.id, reactor.id, reactor.id],
		});
		ecs.update(16);
		expect(system.components.power?.currentPower).toEqual(3);
		expect(reactor.components.isReactor?.currentOutput).toEqual(3);

		system.updateComponent("power", { powerDraw: 2 });
		ecs.update(16);
		expect(system.components.power?.currentPower).toEqual(2);
		expect(reactor.components.isReactor?.currentOutput).toEqual(2);
	});

	it("should properly distribute power from a single reactor to multiple systems", () => {
		const reactor = new Entity();
		reactor.addComponent("isShipSystem", { type: "reactor" });
		reactor.addComponent("isReactor", {
			currentOutput: 6,
		});
		ship.components.shipSystems?.shipSystems.set(reactor.id, {});
		ecs.addEntity(reactor);

		const system1 = new Entity();
		system1.addComponent("isShipSystem", { type: "generic" });
		system1.addComponent("power", {
			powerDraw: 3,
			currentPower: 0,
			powerSources: [reactor.id, reactor.id, reactor.id],
		});
		ship.components.shipSystems?.shipSystems.set(system1.id, {});
		ecs.addEntity(system1);
		const system2 = new Entity();
		system2.addComponent("isShipSystem", { type: "generic" });
		system2.addComponent("power", {
			powerDraw: 3,
			currentPower: 0,
			powerSources: [reactor.id, reactor.id, reactor.id],
		});
		ship.components.shipSystems?.shipSystems.set(system2.id, {});
		ecs.addEntity(system2);

		ecs.update(16);
		expect(system1.components.power?.currentPower).toEqual(3);
		expect(system2.components.power?.currentPower).toEqual(3);

		system1.updateComponent("power", { powerDraw: 1 });
		ecs.update(16);
		expect(system1.components.power?.currentPower).toEqual(1);
		expect(system2.components.power?.currentPower).toEqual(3);
	});

	it("should work with multiple reactors connected to multiple systems", () => {
		const reactor = new Entity();
		reactor.addComponent("isShipSystem", { type: "reactor" });
		reactor.addComponent("isReactor", {
			currentOutput: 12,
		});
		ship.components.shipSystems?.shipSystems.set(reactor.id, {});
		ecs.addEntity(reactor);

		const system1 = new Entity();
		system1.addComponent("isShipSystem", { type: "generic" });
		system1.addComponent("power", {
			powerDraw: 4,
			currentPower: 0,
			powerSources: [reactor.id, reactor.id],
		});
		ship.components.shipSystems?.shipSystems.set(system1.id, {});
		ecs.addEntity(system1);
		const system2 = new Entity();
		system2.addComponent("isShipSystem", { type: "generic" });
		system2.addComponent("power", {
			powerDraw: 4,
			currentPower: 0,
			powerSources: [reactor.id, reactor.id],
		});
		ship.components.shipSystems?.shipSystems.set(system2.id, {});
		ecs.addEntity(system2);
		const system3 = new Entity();
		system3.addComponent("isShipSystem", { type: "generic" });
		system3.addComponent("power", {
			powerDraw: 4,
			currentPower: 0,
			powerSources: [reactor.id, reactor.id],
		});
		ship.components.shipSystems?.shipSystems.set(system3.id, {});
		ecs.addEntity(system3);
		const system4 = new Entity();
		system4.addComponent("isShipSystem", { type: "generic" });
		system4.addComponent("power", {
			powerDraw: 4,
			currentPower: 0,
			powerSources: [reactor.id, reactor.id],
		});
		ship.components.shipSystems?.shipSystems.set(system4.id, {});
		ecs.addEntity(system4);

		ecs.update(16);
		expect(system1.components.power?.currentPower).toEqual(2);
		expect(system2.components.power?.currentPower).toEqual(2);
		expect(system3.components.power?.currentPower).toEqual(2);
		expect(system4.components.power?.currentPower).toEqual(2);

		const reactor2 = new Entity();
		reactor2.addComponent("isShipSystem", { type: "reactor" });
		reactor2.addComponent("isReactor", {
			currentOutput: 2,
		});
		ship.components.shipSystems?.shipSystems.set(reactor2.id, {});
		ecs.addEntity(reactor2);

		system3.updateComponent("power", {
			powerSources: [reactor.id, reactor2.id, reactor.id],
		});
		system4.updateComponent("power", {
			powerSources: [reactor2.id, reactor.id, reactor2.id],
		});
		ecs.update(16);
		expect(system1.components.power?.currentPower).toEqual(2);
		expect(system2.components.power?.currentPower).toEqual(2);
		expect(system3.components.power?.currentPower).toEqual(3);
		expect(system4.components.power?.currentPower).toEqual(3);
	});
	it.only("should properly charge and discharge batteries", () => {
		const reactor = new Entity();
		reactor.addComponent("isShipSystem", { type: "reactor" });
		reactor.addComponent("isReactor", {
			currentOutput: 3,
		});
		ship.components.shipSystems?.shipSystems.set(reactor.id, {});
		ecs.addEntity(reactor);

		const system = new Entity();
		system.addComponent("isShipSystem", { type: "generic" });
		system.addComponent("power", { powerDraw: 20, currentPower: 0 });
		ship.components.shipSystems?.shipSystems.set(system.id, {});
		ecs.addEntity(system);

		const battery = new Entity();
		battery.addComponent("isShipSystem", { type: "battery" });
		battery.addComponent("isBattery", {
			storage: 0,
			powerSources: [reactor.id],
		});
		ship.components.shipSystems?.shipSystems.set(battery.id, {});
		ecs.addEntity(battery);

		expect(battery.components.isBattery?.storage).toEqual(0);
		for (let i = 0; i < 60; i++) {
			ecs.update(16);
		}
		expect(battery.components.isBattery?.storage).toMatchInlineSnapshot(
			"0.0002666666666666669",
		);
		system.updateComponent("power", {
			powerSources: [battery.id, battery.id],
		});
		for (let i = 0; i < 30; i++) {
			ecs.update(16);
		}
		expect(battery.components.isBattery?.storage).toMatchInlineSnapshot(
			"0.0001333333333333334",
		);

		system.updateComponent("power", {
			powerSources: [],
		});
		battery.updateComponent("isBattery", {
			storage: 0,
			powerSources: Array.from({
				length: battery.components.isBattery!.chargeRate,
			}).map(() => reactor.id),
		});
		ecs.update(16);
		const storage = battery.components.isBattery?.storage;
		expect(storage).toBeGreaterThan(0);

		battery.updateComponent("isBattery", {
			storage: 0,
			powerSources: Array.from({
				length: battery.components.isBattery!.chargeRate,
			}).map(() => reactor.id),
		});
		ecs.update(16);
		expect(storage).toEqual(battery.components.isBattery?.storage);

		battery.updateComponent("isBattery", { storage: 0 });
		ecs.update(16);
		expect(battery.components.isBattery?.chargeAmount).toEqual(4);

		// It should take about 32 minutes to fully charge a battery at this rate.
		for (let i = 0; i < 60 * 60 * 32; i++) {
			ecs.update(16);
		}
		expect(battery.components.isBattery?.storage).toEqual(
			battery.components.isBattery?.capacity,
		);

		// It should take about 21 minutes to fully discharge a battery at this rate.
		expect(battery.components.isBattery?.storage).toEqual(2);
		battery.updateComponent("isBattery", {
			powerSources: [],
		});
		system.updateComponent("power", {
			powerSources: Array.from({
				length: battery.components.isBattery!.outputRate,
			}).map(() => battery.id),
		});
		ecs.update(16);
		expect(battery.components.isBattery?.storage).toBeLessThan(2);
		expect(battery.components.isBattery?.outputAmount).toEqual(6);
		expect(system.components.power?.currentPower).toEqual(6);
		for (let i = 0; i < 60 * 60 * 21; i++) {
			ecs.update(16);
		}
		expect(battery.components.isBattery?.outputAmount).toEqual(0);
		expect(system.components.power?.currentPower).toEqual(0);
		expect(battery.components.isBattery?.storage).toEqual(0);
	});

	it("should perform decently well", () => {
		const reactors = Array.from({ length: 5 }).map(() => {
			const reactor = new Entity();
			reactor.addComponent("isShipSystem", { type: "reactor" });
			reactor.addComponent("isReactor", {
				currentOutput: 10,
			});
			ship.components.shipSystems?.shipSystems.set(reactor.id, {});
			ecs.addEntity(reactor);
			return reactor;
		});

		const batteries = Array.from({ length: 4 }).map(() => {
			const battery = new Entity();
			battery.addComponent("isShipSystem", { type: "battery" });
			battery.addComponent("isBattery", {
				storage: 0,
			});
			Array.from({
				length: battery.components.isBattery?.outputRate || 0,
			}).forEach(() => {
				const reactor = randomFromList(reactors);
				battery.updateComponent("isBattery", {
					powerSources: [
						...(battery.components.isBattery?.powerSources || []),
						reactor.id,
					],
				});
			});
			ship.components.shipSystems?.shipSystems.set(battery.id, {});
			ecs.addEntity(battery);
			return battery;
		});

		const reactorsAndBatteries = [...reactors, ...batteries];
		Array.from({ length: 50 }).map(() => {
			const system = new Entity();
			system.addComponent("isShipSystem", { type: "generic" });
			system.addComponent("power", {
				powerDraw: Math.ceil(Math.random() * 6),
				currentPower: 0,
			});
			ship.components.shipSystems?.shipSystems.set(system.id, {});
			ecs.addEntity(system);
			for (let i = 0; i < (system.components.power?.powerDraw || 0); i++) {
				const powerSource = randomFromList(reactorsAndBatteries);
				system.updateComponent("isBattery", {
					powerSources: [
						...(system.components.power?.powerSources || []),
						powerSource.id,
					],
				});
			}

			return system;
		});

		const time = performance.now();
		ecs.update(16);
		expect(performance.now() - time).toBeLessThan(1);
	});
});
