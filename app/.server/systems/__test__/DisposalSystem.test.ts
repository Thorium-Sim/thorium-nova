import { pubsub } from "@thorium/.server/init/pubsub";
import { DataStreamSystem } from "@thorium/.server/systems/DataStreamSystem";
import { DisposalSystem } from "@thorium/.server/systems/DisposalSystem";
import { thoriumContext } from "@thorium/utils/.server/context";
import { createMockDataContext } from "@thorium/utils/.server/createMockDataContext";
import { testDataStoreProps } from "@thorium/utils/.server/db-fs/testDataStoreProps";
import { ECS, Entity, type System } from "@thorium/utils/ecs";
import { aroundEach, beforeEach, describe, expect, it } from "vitest";

aroundEach(async (runTest) => {
	await thoriumContext.run(testDataStoreProps, async () => {
		await runTest();
	});
});

describe("DisposalSystem", () => {
	let ecs: ECS;
	let dataStreamSystem: System;
	let disposalSystem: System;
	beforeEach(() => {
		const mockDataContext = createMockDataContext();

		ecs = new ECS(mockDataContext.server);
		dataStreamSystem = new DataStreamSystem();
		ecs.addSystem(dataStreamSystem);
		disposalSystem = new DisposalSystem();
		ecs.addSystem(disposalSystem);
	});

	it("should dispose of an entity with the component when that entity's parent is still present", () => {
		const parentEntity = new Entity();
		ecs.addEntity(parentEntity);
		const entity1 = new Entity();
		entity1.updateComponent("disposable", { entityIds: [parentEntity.id] });
		ecs.addEntity(entity1);
		const entity2 = new Entity();
		entity2.updateComponent("disposable", { entityIds: [entity1.id] });
		ecs.addEntity(entity2);

		expect(ecs.entities.size).toEqual(3);

		ecs.update(16);

		expect(ecs.entities.size).toEqual(3);

		ecs.removeEntity(parentEntity);

		expect(ecs.entities.size).toEqual(2);

		ecs.update(16);

		expect(ecs.entities.size).toEqual(0);
	});
	it("should dispose of the entity with the component when the entity list is empty", () => {
		const entity1 = new Entity();
		entity1.updateComponent("disposable", { entityIds: [] });
		ecs.addEntity(entity1);

		expect(ecs.entities.size).toEqual(1);

		ecs.update(16);

		expect(ecs.entities.size).toEqual(0);
	});
	it("should not dispose of an entity without the component", () => {
		const entity1 = new Entity();
		entity1.updateComponent("disposable", { entityIds: [] });
		ecs.addEntity(entity1);
		const entity2 = new Entity();
		ecs.addEntity(entity2);

		expect(ecs.entities.size).toEqual(2);

		ecs.update(16);

		expect(ecs.entities.size).toEqual(1);
	});
	it("should trigger a publish on a procedure that corresponds to the removed entity", () => {
		let publishCount = 0;
		pubsub.subscribe.sensors.scans(() => {
			publishCount++;
		});
		const parentEntity = new Entity();
		ecs.addEntity(parentEntity);
		const entity1 = new Entity();
		entity1.updateComponent("disposable", { entityIds: [] });
		entity1.updateComponent("scan", { parentId: parentEntity.id });
		ecs.addEntity(entity1);

		expect(publishCount).toEqual(0);
		expect(ecs.entities.size).toEqual(2);
		ecs.update(16);

		expect(ecs.entities.size).toEqual(1);
		expect(publishCount).toEqual(1);
	});
});
