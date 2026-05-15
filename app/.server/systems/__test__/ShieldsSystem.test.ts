import { createMockDataContext } from "@thorium/utils/.server/createMockDataContext";
import { DataStore } from "@thorium/utils/.server/db-fs";
import { testDataStoreProps } from "@thorium/utils/.server/db-fs/testDataStoreProps";
import { ECS, Entity } from "@thorium/utils/ecs";
import { aroundEach, describe, expect, it } from "vitest";

import { ShieldsSystem } from "../ShieldsSystem";

aroundEach(async (runTest) => {
	await DataStore.operations.run(testDataStoreProps, async () => {
		await runTest();
	});
});

/**
 * Helper function to create an ECS instance with a ShieldsSystem and a ship entity
 * that has isShields, power, and damage components.
 * @param shields - Initial values for the isShields component
 * @param power - Initial values for the power component
 * @param damage - Initial values for the damage component
 * @returns An object containing the ECS instance, ShieldsSystem, shields entity, and ship entity
 */
function setupShieldsSystemTest({
	shields,
	power,
	damage,
}: {
	shields?: {
		maxStrength?: number;
		state?: "up" | "down";
		strength?: number;
	};
	power?: {
		currentPower?: number;
		powerLevels?: number[];
	};
	damage?: {
		efficiency?: number;
	};
} = {}) {
	const mockDataContext = createMockDataContext();
	const ecs = new ECS(mockDataContext.server);

	const shieldsSystem = new ShieldsSystem();
	ecs.addSystem(shieldsSystem);

	const shipEntity = new Entity();
	shipEntity.addComponent("isShip");
	shipEntity.addComponent("shipSystems");
	ecs.addEntity(shipEntity);

	const shieldsEntity = new Entity();
	shieldsEntity.addComponent("isShipSystem", {
		type: "shields",
		shipId: shipEntity.id,
	});
	shieldsEntity.addComponent("isShields", shields);
	shieldsEntity.addComponent("power", power);
	shieldsEntity.addComponent("damage", damage);
	shipEntity.components.shipSystems?.shipSystems.set(shieldsEntity.id, {});
	ecs.addEntity(shieldsEntity);

	return { ecs, shieldsSystem, shieldsEntity, shipEntity };
}

describe("ShieldsSystem", () => {
	describe("test()", () => {
		it("returns true for entities with isShields component", () => {
			const { shieldsSystem, shieldsEntity } = setupShieldsSystemTest();
			expect(shieldsSystem.test(shieldsEntity)).toBe(true);
		});

		it("returns false for entities without isShields component", () => {
			const { shieldsSystem, shipEntity } = setupShieldsSystemTest();
			const randomEntity = new Entity();
			expect(shieldsSystem.test(shipEntity)).toBe(false);
			expect(shieldsSystem.test(randomEntity)).toBe(false);
		});
	});

	describe("update()", () => {
		it("shields remain at full power when already charged", () => {
			const { ecs, shieldsEntity } = setupShieldsSystemTest({
				shields: { maxStrength: 5, strength: 5, state: "up" },
			});
			expect(shieldsEntity.components.isShields?.strength).toBe(5);
			ecs.update(1000); // 1 second
			expect(shieldsEntity.components.isShields?.strength).toBe(5); // remains at max
		});

		it("shields recharge when not at full strength", () => {
			const { ecs, shieldsEntity } = setupShieldsSystemTest({
				shields: { maxStrength: 5, strength: 3, state: "up" },
				power: { currentPower: 10, powerLevels: [10] },
			});
			expect(shieldsEntity.components.isShields?.strength).toBe(3);
			ecs.update(18000); // 18 seconds
			expect(shieldsEntity.components.isShields?.strength).toBe(3.5); // has recharged
			ecs.update(18000); // 18 more seconds
			expect(shieldsEntity.components.isShields?.strength).toBe(4); // has recharged more
		});

		it("shields recharge faster when at higher power", () => {
			const { ecs, shieldsEntity } = setupShieldsSystemTest({
				shields: { maxStrength: 5, strength: 3, state: "up" },
				power: { currentPower: 20, powerLevels: [20] },
			});
			expect(shieldsEntity.components.isShields?.strength).toBe(3);
			ecs.update(18000); // 18 seconds
			expect(shieldsEntity.components.isShields?.strength).toBe(4); // has recharged
			ecs.update(18000); // 18 seconds
			expect(shieldsEntity.components.isShields?.strength).toBe(5); // has recharged more
		});

		it("shields recharge at lower rate when damaged", () => {
			const { ecs, shieldsEntity } = setupShieldsSystemTest({
				shields: { maxStrength: 5, strength: 3, state: "up" },
				power: { currentPower: 10, powerLevels: [10] },
				damage: { efficiency: 0.8 },
			});
			expect(shieldsEntity.components.isShields?.strength).toBe(3);
			ecs.update(18000); // 18 seconds
			expect(shieldsEntity.components.isShields?.strength).toBe(3.4); // has recharged at lower rate
			ecs.update(18000); // 18 seconds
			expect(shieldsEntity.components.isShields?.strength).toBe(3.8); // has recharged more at lower rate
		});

		it("shields drain quickly when down", () => {
			const { ecs, shieldsEntity } = setupShieldsSystemTest({
				shields: { maxStrength: 5, strength: 5, state: "down" },
				power: { currentPower: 10, powerLevels: [10] },
			});
			expect(shieldsEntity.components.isShields?.strength).toBe(5);
			ecs.update(1000); // 1 second
			expect(shieldsEntity.components.isShields?.strength).toBe(4); // has drained
			ecs.update(1000); // 1 more second
			expect(shieldsEntity.components.isShields?.strength).toBe(3); // has drained more
			ecs.update(3000); // 3 more seconds
			expect(shieldsEntity.components.isShields?.strength).toBe(0); // has drained completely to 0
		});

		it("shields will not drain below 0", () => {
			const { ecs, shieldsEntity } = setupShieldsSystemTest({
				shields: { maxStrength: 5, strength: 0, state: "down" },
				power: { currentPower: 10, powerLevels: [10] },
			});
			expect(shieldsEntity.components.isShields?.strength).toBe(0);
			ecs.update(1000); // 1 second
			expect(shieldsEntity.components.isShields?.strength).toBe(0); // remains at 0
		});

		it("shields will drain when there is insufficient power", () => {
			const { ecs, shieldsEntity } = setupShieldsSystemTest({
				shields: { maxStrength: 5, strength: 5, state: "up" },
				power: { currentPower: 10, powerLevels: [20] },
			});
			expect(shieldsEntity.components.isShields?.strength).toBe(5);
			ecs.update(1000); // 1 second
			expect(shieldsEntity.components.isShields?.strength).toBe(4); // has drained
		});

		it("shields will still charge even if powerLevels is an empty array", () => {
			const { ecs, shieldsEntity } = setupShieldsSystemTest({
				shields: { maxStrength: 5, strength: 3, state: "up" },
				power: { currentPower: 10, powerLevels: [] },
			});
			expect(shieldsEntity.components.isShields?.strength).toBe(3);
			ecs.update(18000); // 18 seconds
			expect(shieldsEntity.components.isShields?.strength).toBe(3.5); // has recharged
		});
	});
});
