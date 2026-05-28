import { createMockDataContext } from "@thorium/utils/.server/createMockDataContext";
import { DataStore } from "@thorium/utils/.server/db-fs";
import { testDataStoreProps } from "@thorium/utils/.server/db-fs/testDataStoreProps";
import { applySystemDamage } from "@thorium/utils/.server/ship/collisionDamage";
import { type ECS, Entity } from "@thorium/utils/ecs";
import { aroundEach, beforeEach, describe, expect, it, vi } from "vitest";

import { SpontaneousFailureSystem } from "../SpontaneousFailureSystem";

aroundEach(async (runTest) => {
	await DataStore.operations.run(testDataStoreProps, async () => {
		await runTest();
	});
});

vi.mock("@thorium/utils/.server/ship/collisionDamage", () => {
	return {
		applySystemDamage: vi.fn(),
	};
});

function makeEntity(
	ecs: ECS,
	{
		isPlayerShip = true,
		offline = false,
		offlineDamage = 20,
		failureRisk = 0,
	}: {
		isPlayerShip?: boolean;
		offline?: boolean;
		offlineDamage?: number;
		failureRisk?: number;
	} = {},
) {
	const entity = new Entity();
	if (isPlayerShip) {
		entity.addComponent("isPlayerShip", { value: true });
	}
	entity.addComponent("damage", {
		offline,
		offlineDamage,
		failureRisk,
	});
	ecs.addEntity(entity);
	return entity;
}

describe("SpontaneousFailureSystem", () => {
	let ecs: ECS;
	let system: SpontaneousFailureSystem;
	beforeEach(() => {
		const mockDataContext = createMockDataContext();

		ecs = mockDataContext.ecs;
		system = new SpontaneousFailureSystem();
		ecs.addSystem(system);
		(applySystemDamage as any).mockClear();
	});

	describe("test()", () => {
		it("returns true for entities with isPlayerShip component", () => {
			const entity = makeEntity(ecs, { isPlayerShip: true });
			expect(system.test(entity)).toBe(true);
		});

		it("returns false for entities without isPlayerShip component", () => {
			const entity = makeEntity(ecs, { isPlayerShip: false });
			expect(system.test(entity)).toBe(false);
		});
	});

	describe("update()", () => {
		it("does not apply damage if system is offline", () => {
			const _entity = makeEntity(ecs, { offline: true, failureRisk: 1.0 });
			ecs.update(1);
			expect((applySystemDamage as any).mock.calls.length).toBe(0);
		});

		it("does not apply damage if failureRisk is 0", () => {
			const _entity = makeEntity(ecs, { offline: false, failureRisk: 0 });
			ecs.update(1);
			expect((applySystemDamage as any).mock.calls.length).toBe(0);
		});

		it("applies damage if randomRoll < failureRisk", () => {
			makeEntity(ecs, {
				offline: false,
				failureRisk: 0.5,
				offlineDamage: 20,
			});

			// Mock RNG to return a value less than failureRisk
			vi.spyOn(ecs.rng, "nextAsPercentage").mockReturnValue(0.3); // 0.3 < 0.5

			ecs.update(1);

			expect((applySystemDamage as any).mock.calls.length).toBe(1);
			expect((applySystemDamage as any).mock.calls[0][1]).toBeGreaterThan(0);

			vi.restoreAllMocks();
		});

		it.skip("does not apply damage if randomRoll >= failureRisk", () => {
			const _entity = makeEntity(ecs, {
				offline: false,
				failureRisk: 0.5,
			});

			// Mock RNG to return a value greater than or equal to failureRisk
			vi.spyOn(ecs.rng, "next").mockReturnValue(0.7); // 0.7 >= 0.5

			ecs.update(1);

			expect((applySystemDamage as any).mock.calls.length).toBe(0);

			vi.restoreAllMocks();
		});

		it("does not apply damage if entity has no damage component", () => {
			const entity = new Entity();
			entity.addComponent("isPlayerShip", { value: true });
			ecs.addEntity(entity);

			ecs.update(1);

			expect((applySystemDamage as any).mock.calls.length).toBe(0);
		});
	});
});
