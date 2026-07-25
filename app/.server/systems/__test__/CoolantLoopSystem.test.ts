import { CoolantLoopSystem } from "@thorium/.server/systems/CoolantLoopSystem";
import { thoriumContext } from "@thorium/utils/.server/context";
import { createMockDataContext } from "@thorium/utils/.server/createMockDataContext";
import { testDataStoreProps } from "@thorium/utils/.server/db-fs/testDataStoreProps";
import { executeBlocks } from "@thorium/utils/.server/executeBlocks";
import { processTriggers } from "@thorium/utils/.server/processTriggers";
import { ECS } from "@thorium/utils/ecs";
import Entity from "@thorium/utils/ecs/entity";
import { aroundEach, beforeEach, describe, expect, it } from "vitest";

aroundEach(async (runTest) => {
	await thoriumContext.run(testDataStoreProps, async () => {
		await runTest();
	});
});

describe("CoolantLoopSystem", () => {
	let ecs: ECS;
	let ship: Entity;
	let coolantReservoir: Entity;
	let coolantPump: Entity;
	let coolantRadiator: Entity;
	let system1: Entity;
	let system2: Entity;

	beforeEach(() => {
		const mockDataContext = createMockDataContext();
		ecs = new ECS(mockDataContext.server);
		ecs.executeBlocks = (blocks, blockMetadata) => executeBlocks(ecs, blocks, blockMetadata);
		ecs.processTriggers = (events) => processTriggers(ecs, events);
		ecs.addSystem(new CoolantLoopSystem());

		ship = new Entity();
		ship.addComponent("shipSystems");
		ship.addComponent("isShip");
		ecs.addEntity(ship);
		const shipSystemsMap = ship.components.shipSystems!.shipSystems;

		coolantReservoir = new Entity();
		coolantReservoir.addComponent("heat", { coolantVolume: 1000 });
		coolantReservoir.addComponent("isCoolantReservoir");
		coolantReservoir.addComponent("isShipSystem", { shipId: ship.id, type: "coolantReservoir" });
		shipSystemsMap.set(coolantReservoir.id, {});
		ecs.addEntity(coolantReservoir);

		coolantRadiator = new Entity();
		coolantRadiator.addComponent("heat", { inCoolantLoop: true });
		coolantRadiator.addComponent("isCoolantRadiator");
		coolantRadiator.addComponent("isShipSystem", { shipId: ship.id, type: "coolantRadiator" });
		shipSystemsMap.set(coolantRadiator.id, {});
		ecs.addEntity(coolantRadiator);

		coolantPump = new Entity();
		coolantPump.addComponent("power", { currentPower: 1, powerLevels: [1, 8] });
		coolantPump.addComponent("isCoolantPump");
		coolantPump.addComponent("isShipSystem", { shipId: ship.id, type: "coolantPump" });
		shipSystemsMap.set(coolantPump.id, {});
		ecs.addEntity(coolantPump);

		system1 = new Entity();
		system1.addComponent("heat");
		system1.addComponent("isShipSystem", { shipId: ship.id, type: "generic" });
		shipSystemsMap.set(system1.id, {});
		ecs.addEntity(system1);

		system2 = new Entity();
		system2.addComponent("heat");
		system2.addComponent("isShipSystem", { shipId: ship.id, type: "generic" });
		shipSystemsMap.set(system2.id, {});
		ecs.addEntity(system2);
	});
	it("should cool the reservoir when no systems are attached", () => {
		const reservoirTemp = coolantReservoir.components.heat!.heat;
		for (let i = 0; i < 60; i++) {
			ecs.update(16);
		}
		expect(coolantReservoir.components.heat!.heat).toBeLessThan(reservoirTemp);
	});
	it("should heat the reservoir when systems are attached and the radiator is not attached", () => {
		const reservoirTemp = coolantReservoir.components.heat!.heat;
		system1.updateComponent("heat", { inCoolantLoop: true, heatLoad: 1 });
		coolantRadiator.updateComponent("heat", { inCoolantLoop: false });
		for (let i = 0; i < 60; i++) {
			ecs.update(16);
		}
		expect(coolantReservoir.components.heat!.heat).toBeGreaterThan(reservoirTemp);
	});
	it("should cool systems when the reservoir temperature is lower", () => {
		coolantReservoir.updateComponent("heat", { heat: 100 });
		const beforeTemp = 1000;
		system1.updateComponent("heat", { inCoolantLoop: true, heatLoad: 0.1, heat: beforeTemp });
		for (let i = 0; i < 60; i++) {
			ecs.update(16);
		}
		expect(system1.components.heat!.heat).toBeLessThan(beforeTemp);
	});
	it("should heat systems when not connected to the coolant loop", () => {
		const beforeTemp = 200;
		system1.updateComponent("heat", { inCoolantLoop: false, heatLoad: 0.1, heat: beforeTemp });
		for (let i = 0; i < 60 * 60; i++) {
			ecs.update(16);
		}
		expect(system1.components.heat!.heat).toBeGreaterThan(beforeTemp);
	});
	it("should cool better if the pump is running faster", () => {
		coolantReservoir.updateComponent("heat", { heat: 100 });
		system1.updateComponent("heat", { inCoolantLoop: true, heatLoad: 1, heat: 1000 });
		coolantReservoir.updateComponent("heat", { inCoolantLoop: true, heatLoad: 0.1, heat: 200 });
		coolantRadiator.updateComponent("heat", { inCoolantLoop: true, heat: 100 });
		for (let i = 0; i < 60; i++) {
			ecs.update(16);
		}
		const slowPumpHeat = system1.components.heat!.heat;

		system1.updateComponent("heat", { inCoolantLoop: true, heatLoad: 1, heat: 1000 });
		coolantReservoir.updateComponent("heat", { inCoolantLoop: true, heatLoad: 0.1, heat: 200 });
		coolantRadiator.updateComponent("heat", { inCoolantLoop: true, heat: 100 });
		for (let i = 0; i < 60; i++) {
			ecs.update(16);
		}
		// Verify that we're resetting the simulation correctly
		expect(system1.components.heat!.heat).toEqual(slowPumpHeat);
	});
});
