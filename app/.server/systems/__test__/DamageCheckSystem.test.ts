import { applyDamage } from "@thorium/utils/.server/ship/collisionDamage";
import type { Entity } from "@thorium/utils/ecs";
import { getAggregateDamage } from "@thorium/utils/flags/damageTypes";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { DamageCheckSystem } from "../DamageCheckSystem";

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

function makeEntity({
	isPlayerShip = true,
	vulnerability = "normal",
	offline = false,
	onlineDamage = 10,
	offlineDamage = 20,
	cascadeRisk = 0,
} = {}) {
	return {
		components: {
			isPlayerShip: isPlayerShip ? { value: true } : undefined,
			damage: {
				vulnerability: vulnerability as
					| "normal"
					| "vulnerable"
					| "invulnerable",
				offline,
				onlineDamage,
				offlineDamage,
				cascadeRisk,
			},
		},
	} as Entity;
}

describe("DamageCheck", () => {
	let system: DamageCheckSystem;
	beforeEach(() => {
		system = new DamageCheckSystem();
		(applyDamage as any).mockClear();
		(getAggregateDamage as any).mockClear();
	});

	describe("test()", () => {
		it("returns true for player ship and not invulnerable", () => {
			const entity = makeEntity();
			expect(system.test(entity)).toBe(true);
		});
		it("returns false for non-player ship", () => {
			const entity = makeEntity({ isPlayerShip: false });
			expect(system.test(entity)).toBe(false);
		});
		it("returns false for invulnerable ship", () => {
			const entity = makeEntity({ vulnerability: "invulnerable" });
			expect(system.test(entity)).toBe(false);
		});
	});

	describe("update()", () => {
		it("brings system online if offline and aggregateDamage <= onlineDamage", () => {
			const entity = makeEntity({ offline: true, onlineDamage: 10 });
			(getAggregateDamage as any).mockReturnValue(5);
			system.update(entity, 1);
			expect(entity.components.damage?.offline).toBe(false);
		});
		it("keeps system offline if aggregateDamage > onlineDamage", () => {
			const entity = makeEntity({ offline: true, onlineDamage: 10 });
			(getAggregateDamage as any).mockReturnValue(15);
			system.update(entity, 1);
			expect(entity.components.damage?.offline).toBe(true);
		});
		it("takes system offline if offlineDamage <= aggregateDamage", () => {
			const entity = makeEntity({ offline: false, offlineDamage: 10 });
			(getAggregateDamage as any).mockReturnValue(15);
			system.update(entity, 1);
			expect(entity.components.damage?.offline).toBe(true);
		});
		it("keeps system online if offlineDamage > aggregateDamage", () => {
			const entity = makeEntity({ offline: false, offlineDamage: 10 });
			(getAggregateDamage as any).mockReturnValue(5);
			system.update(entity, 1);
			expect(entity.components.damage?.offline).toBe(false);
		});
		it("triggers cascade if system goes offline and cascadeRisk > 0 and randomRoll < cascadeRisk * elapsed", () => {
			const entity = makeEntity({
				offline: false,
				offlineDamage: 10,
				cascadeRisk: 100,
			});
			(getAggregateDamage as any).mockReturnValue(15);
			vi.spyOn(Math, "random").mockReturnValue(0);
			system.update(entity, 2 /* any elapsed greater than 0 */);
			expect((applyDamage as any).mock.calls.length).toBeGreaterThan(0);
			vi.restoreAllMocks();
		});
		it("does not trigger cascade if randomRoll >= cascadeRisk * elapsed", () => {
			const entity = makeEntity({
				offline: false,
				offlineDamage: 10,
				cascadeRisk: 10,
			});
			(getAggregateDamage as any).mockReturnValue(15);
			vi.spyOn(Math, "random").mockReturnValue(0.2); // 0.2*100 = 20 > 10*1
			system.update(entity, 1);
			expect((applyDamage as any).mock.calls.length).toBe(0);
			vi.restoreAllMocks();
		});
	});
});
