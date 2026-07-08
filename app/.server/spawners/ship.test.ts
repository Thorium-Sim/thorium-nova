import { thoriumContext } from "@thorium/utils/.server/context";
import {
	createMockDataContext,
	createMockRouter,
} from "@thorium/utils/.server/createMockDataContext";
import { testDataStoreProps } from "@thorium/utils/.server/db-fs/testDataStoreProps";
import { describe, expect, it } from "vitest";

import { spawnShip } from "./ship";
describe("Ship Spawner", () => {
	it("should spawn a ship from a template", async () => {
		await thoriumContext.run(testDataStoreProps, async () => {
			const dataContext = createMockDataContext();
			const router = createMockRouter(dataContext);

			await createBaseShipPlugin(router);

			const shipPlugin = dataContext.server.plugins
				.find((p) => p.name === "Test Plugin")
				?.aspects.ships.find((s) => s.name === "Test Ship");
			expect(shipPlugin).toBeDefined();
			if (!shipPlugin) throw new Error("Ship not found");
			const { ship, extraEntities } = await spawnShip(dataContext, shipPlugin, {
				name: "Spawned Ship",
				position: { x: 10, y: 20, z: 30, type: "interstellar", parentId: null },
				playerShip: true,
				flightMode: "nova",
			});
			expect(ship.components.identity?.name).toEqual("Spawned Ship");
			expect(ship.components.position?.x).toEqual(10);
			expect(ship.components.position?.y).toEqual(20);
			expect(ship.components.position?.z).toEqual(30);
			expect(extraEntities.length).toEqual(5);
			expect(extraEntities[0].components.identity?.name).toEqual("Generic System");
			expect(extraEntities[0].components.isShipSystem?.type).toEqual("generic");
			expect(extraEntities[1].components.cargoContainer?.volume).toEqual(4000);
			expect(extraEntities[2].components.cargoContainer?.volume).toEqual(4000);
		});
	});

	it("should spawn batteries and connect them to ship systems", async () => {
		await thoriumContext.run(testDataStoreProps, async () => {
			const dataContext = createMockDataContext();
			const router = createMockRouter(dataContext);

			const shipId = await createBaseShipPlugin(router);
			await createBatteries(router, shipId);

			const poweredSystem1 = await router.plugin.systems.create({
				pluginId: "Test Plugin",
				name: "Powered System1",
				type: "shields",
			});
			await router.plugin.systems.update({
				pluginId: "Test Plugin",
				systemId: poweredSystem1.shipSystemId,
				connectedBatteryType: "median",
			});
			await router.plugin.ship.toggleSystem({
				pluginId: "Test Plugin",
				shipId: shipId,
				systemPlugin: "Test Plugin",
				systemId: poweredSystem1.shipSystemId,
			});

			const poweredSystem2 = await router.plugin.systems.create({
				pluginId: "Test Plugin",
				name: "Powered System2",
				type: "shields",
			});
			await router.plugin.systems.update({
				pluginId: "Test Plugin",
				systemId: poweredSystem2.shipSystemId,
				connectedBatteryType: "output",
			});
			await router.plugin.ship.toggleSystem({
				pluginId: "Test Plugin",
				shipId: shipId,
				systemPlugin: "Test Plugin",
				systemId: poweredSystem2.shipSystemId,
			});

			const shipPlugin = dataContext.server.plugins
				.find((p) => p.name === "Test Plugin")
				?.aspects.ships.find((s) => s.name === "Test Ship");
			expect(shipPlugin).toBeDefined();
			if (!shipPlugin) throw new Error("Ship not found");
			const { extraEntities } = await spawnShip(dataContext, shipPlugin, {
				name: "Spawned Ship",
				position: { x: 10, y: 20, z: 30, type: "interstellar", parentId: null },
				playerShip: true,
				flightMode: "nova",
			});

			const poweredSystemEntity1 = extraEntities.find(
				(e) => e.components.identity?.name === "Powered System1",
			);
			const systemBattery1 = extraEntities.find(
				(e) => e.id === poweredSystemEntity1?.components.power?.batterySource,
			);
			expect(systemBattery1?.components.identity?.name).toEqual("Middle Battery System");

			const poweredSystemEntity2 = extraEntities.find(
				(e) => e.components.identity?.name === "Powered System2",
			);
			const systemBattery2 = extraEntities.find(
				(e) => e.id === poweredSystemEntity2?.components.power?.batterySource,
			);
			expect(systemBattery2?.components.identity?.name).toEqual("High Output Battery System");
		});
	});
});

async function createBaseShipPlugin(router: ReturnType<typeof createMockRouter>) {
	const shipSystem = await router.plugin.systems.create({
		pluginId: "Test Plugin",
		name: "Generic System",
		type: "generic",
	});

	const createdShip = await router.plugin.ship.create({
		pluginId: "Test Plugin",
		name: "Test Ship",
	});

	await router.plugin.ship.deck.create({
		pluginId: "Test Plugin",
		shipId: "Test Ship",
	});

	const { id } = await router.plugin.ship.deck.addNode({
		pluginId: "Test Plugin",
		shipId: "Test Ship",
		deckId: "Deck 1",
		x: 50,
		y: 50,
	});
	await router.plugin.ship.deck.updateNode({
		deckId: "Deck 1",
		shipId: "Test Ship",
		pluginId: "Test Plugin",
		nodeId: id,
		isRoom: true,
		flags: ["cargo"],
	});

	await router.plugin.ship.toggleSystem({
		pluginId: "Test Plugin",
		shipId: createdShip.shipId,
		systemPlugin: "Test Plugin",
		systemId: shipSystem.shipSystemId,
	});

	return createdShip.shipId;
}

async function createBatteries(router: ReturnType<typeof createMockRouter>, shipId: string) {
	const battery1 = await router.plugin.systems.create({
		pluginId: "Test Plugin",
		name: "High Capacity Battery System",
		type: "battery",
	});
	await router.plugin.systems.battery.update({
		pluginId: "Test Plugin",
		systemId: battery1.shipSystemId,
		capacity: 100,
		outputRate: 1,
	});
	await router.plugin.ship.addSystem({
		pluginId: "Test Plugin",
		shipId: shipId,
		systemPlugin: "Test Plugin",
		systemId: battery1.shipSystemId,
	});

	const battery2 = await router.plugin.systems.create({
		pluginId: "Test Plugin",
		name: "High Output Battery System",
		type: "battery",
	});
	await router.plugin.systems.battery.update({
		pluginId: "Test Plugin",
		systemId: battery2.shipSystemId,
		capacity: 1,
		outputRate: 100,
	});

	await router.plugin.ship.addSystem({
		pluginId: "Test Plugin",
		shipId: shipId,
		systemPlugin: "Test Plugin",
		systemId: battery2.shipSystemId,
	});

	const battery3 = await router.plugin.systems.create({
		pluginId: "Test Plugin",
		name: "Middle Battery System",
		type: "battery",
	});
	await router.plugin.systems.battery.update({
		pluginId: "Test Plugin",
		systemId: battery3.shipSystemId,
		capacity: 50,
		outputRate: 50,
	});

	await router.plugin.ship.addSystem({
		pluginId: "Test Plugin",
		shipId: shipId,
		systemPlugin: "Test Plugin",
		systemId: battery3.shipSystemId,
	});
}
