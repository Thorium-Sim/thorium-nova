import { createMockDataContext } from "@thorium/utils/.server/createMockDataContext";
import { ECS, Entity } from "@thorium/utils/ecs";
import { PowerEfficiencyOverloadSystem } from "../PowerEfficiencyOverloadSystem";
import { describe, expect, it, beforeEach, aroundEach } from "vitest";
import { testDataStoreProps } from "@thorium/utils/.server/db-fs/testDataStoreProps";
import { DataStore } from "@thorium/utils/.server/db-fs";
import { getAggregateDamage } from "@thorium/utils/flags/damageTypes";

aroundEach(async (runTest) => {
	await DataStore.operations.run(testDataStoreProps, async () => {
		runTest();
	});
});

describe("PowerEfficiencyOverloadSystem", () => {
	let ecs: ECS;
	let system: Entity;
	beforeEach(() => {
		const mockDataContext = createMockDataContext();

		ecs = new ECS(mockDataContext.server);
		ecs.addSystem(new PowerEfficiencyOverloadSystem());
		system = new Entity();
		system.addComponent("power");
		system.addComponent("damage");
		ecs.addEntity(system);
	});
	it("should slowly decrease when power is below the maxSafePower", () => {
		expect(Math.max(...system.components.power!.powerLevels)).toEqual(20);
		expect(system.components.power?.currentPower).toEqual(10);
		expect(system.components.damage?.efficiency).toEqual(1);
		for (let i = 0; i < 60; i++) {
			ecs.update(16);
		}

		expect(system.components.damage?.efficiency).toMatchInlineSnapshot(
			`0.999959304016354`,
		);

		// The average mission length
		for (let i = 0; i < 60 * 60 * 60 * 2; i++) {
			ecs.update(16);
		}
		expect(system.components.damage?.efficiency).toMatchInlineSnapshot(
			`0.7527000312104539`,
		);
	});
	it("should decrease when power is above maxSafePower", () => {
		expect(Math.max(...system.components.power!.powerLevels)).toEqual(20);
		expect(system.components.damage?.efficiency).toEqual(1);

		const system2 = new Entity();
		system2.addComponent("power");
		system2.addComponent("damage");
		ecs.addEntity(system2);
		system2.updateComponent("power", { currentPower: 24 });

		// It should run for 5 minutes at 20%
		for (let i = 0; i < 60 * 60 * 5; i++) {
			ecs.update(16);
		}

		const systemDamage = getAggregateDamage(system);
		const system2Damage = getAggregateDamage(system2);
		expect(systemDamage > system2Damage);
		expect(system2Damage).toMatchInlineSnapshot(`0.2571257088981171`);
	});
	it.todo("should apply entropy, even when the system isn't overloaded at all", () => {});
});
