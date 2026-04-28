import { createMockDataContext } from "@thorium/utils/.server/createMockDataContext";
import { DataStore } from "@thorium/utils/.server/db-fs";
import { testDataStoreProps } from "@thorium/utils/.server/db-fs/testDataStoreProps";
import { applyDamage } from "@thorium/utils/.server/ship/collisionDamage";
import { ECS, Entity } from "@thorium/utils/ecs";
import { getAggregateDamage } from "@thorium/utils/flags/damageTypes";
import { aroundEach, beforeEach, describe, expect, it, vi } from "vitest";

import { DamageCheckSystem } from "../DamageCheckSystem";

aroundEach(async (runTest) => {
	await DataStore.operations.run(testDataStoreProps, async () => {
		await runTest();
	});
});

vi.mock("@thorium/utils/.server/ship/collisionDamage", () => {
	return {
		applyDamage: vi.fn(),
	};
});
vi.mock("@thorium/utils/flags/damageTypes", async (importOriginal) => {
	const actual = (await importOriginal()) as any;
	return {
		...actual,
		getAggregateDamage: vi.fn(),
	};
});

function makeEntity(
	ecs: ECS,
	{
		vulnerability = "normal",
		offline = false,
		onlineDamage = 10,
		offlineDamage = 20,
		cascadeRisk = 0,
	}: {
		vulnerability?: "normal" | "vulnerable" | "invulnerable";
		offline?: boolean;
		offlineDamage?: number;
		onlineDamage?: number;
		cascadeRisk?: number;
	} = {},
) {
	const entity = new Entity();
	entity.addComponent("damage", {
		vulnerability,
		offline,
		onlineDamage,
		offlineDamage,
		cascadeRisk,
	});
	ecs.addEntity(entity);
	return entity;
}

describe("DamageCheck", () => {
	let ecs: ECS;
	let system: DamageCheckSystem;
	beforeEach(() => {
		const mockDataContext = createMockDataContext();

		ecs = new ECS(mockDataContext.server);
		system = new DamageCheckSystem();
		ecs.addSystem(system);
		(applyDamage as any).mockClear();
		(getAggregateDamage as any).mockClear();
	});

	describe("update()", () => {
		it("brings system online if offline and aggregateDamage <= onlineDamage", () => {
			const entity = makeEntity(ecs, { offline: true, onlineDamage: 10 });
			(getAggregateDamage as any).mockReturnValue(5);
			ecs.update(1);
			expect(entity.components.damage?.offline).toBe(false);
		});
		it("keeps system offline if aggregateDamage > onlineDamage", () => {
			const entity = makeEntity(ecs, { offline: true, onlineDamage: 10 });
			(getAggregateDamage as any).mockReturnValue(15);
			ecs.update(1);
			expect(entity.components.damage?.offline).toBe(true);
		});
		it("takes system offline if offlineDamage <= aggregateDamage", () => {
			const entity = makeEntity(ecs, { offline: false, offlineDamage: 10 });
			(getAggregateDamage as any).mockReturnValue(15);
			ecs.update(1);
			expect(entity.components.damage?.offline).toBe(true);
		});
		it("keeps system online if offlineDamage > aggregateDamage", () => {
			const entity = makeEntity(ecs, { offline: false, offlineDamage: 10 });

			(getAggregateDamage as any).mockReturnValue(5);
			ecs.update(1);
			expect(entity.components.damage?.offline).toBe(false);
		});
		it("triggers cascade if system goes offline and cascadeRisk > 0 and randomRoll < cascadeRisk * elapsed", () => {
			const _entity = makeEntity(ecs, {
				offline: false,
				offlineDamage: 10,
				cascadeRisk: 100,
			});

			(getAggregateDamage as any).mockReturnValue(15);
			ecs.update(2);
			expect((applyDamage as any).mock.calls.length).toBeGreaterThan(0);
			vi.restoreAllMocks();
		});
		it("does not trigger cascade if randomRoll >= cascadeRisk * elapsed", () => {
			const _entity = makeEntity(ecs, {
				offline: false,
				offlineDamage: 10,
				cascadeRisk: 10,
			});

			(getAggregateDamage as any).mockReturnValue(15);
			vi.spyOn(Math, "random").mockReturnValue(0.2); // 0.2*100 = 20 > 10*1
			ecs.update(1);
			expect((applyDamage as any).mock.calls.length).toBe(0);
			vi.restoreAllMocks();
		});
	});
});
