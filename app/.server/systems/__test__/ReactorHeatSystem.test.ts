import { ReactorHeatSystem } from "@thorium/.server/systems/ReactorHeatSystem";
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

describe("ReactorHeatSystem", () => {
	let ecs: ECS;
	let ship: Entity;
	let reactor: Entity;

	beforeEach(() => {
		const mockDataContext = createMockDataContext();
		ecs = new ECS(mockDataContext.server);
		ecs.executeBlocks = (blocks, blockMetadata) => executeBlocks(ecs, blocks, blockMetadata);
		ecs.processTriggers = (events) => processTriggers(ecs, events);
		ecs.addSystem(new ReactorHeatSystem());

		ship = new Entity();
		ship.addComponent("shipSystems");
		ship.addComponent("isShip");
		ecs.addEntity(ship);
		const shipSystemsMap = ship.components.shipSystems!.shipSystems;

		reactor = new Entity();
		reactor.addComponent("heat");
		reactor.addComponent("isReactor");
		reactor.addComponent("isShipSystem", { shipId: ship.id, type: "reactor" });
		shipSystemsMap.set(reactor.id, {});
		ecs.addEntity(reactor);
	});

	it("should generate heat load based on the output", () => {
		reactor.updateComponent("isReactor", { currentOutput: 10, balanced: false });
		ecs.update(16);
		const baseHeatLoad = reactor.components.heat!.heatLoad;
		expect(reactor.components.heat?.heatLoad).toMatchInlineSnapshot(`0.1`);
		reactor.updateComponent("isReactor", { currentOutput: 12, balanced: false });
		ecs.update(16);
		expect(reactor.components.heat?.heatLoad).toBeGreaterThan(baseHeatLoad);
		reactor.updateComponent("isReactor", { currentOutput: 10, balanced: true });
		ecs.update(16);
		expect(reactor.components.heat?.heatLoad).toBeLessThan(baseHeatLoad);
		reactor.updateComponent("isReactor", { currentOutput: 6, balanced: false });
		ecs.update(16);
		expect(reactor.components.heat?.heatLoad).toBeLessThan(baseHeatLoad);
	});
});
