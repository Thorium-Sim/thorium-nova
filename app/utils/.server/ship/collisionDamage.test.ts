import { ShipSystemTypes } from "@thorium/.server/classes/Plugins/ShipSystems/shipSystemTypes";
import { applyDamage } from "@thorium/utils/.server/ship/collisionDamage";
import { ECS, Entity } from "@thorium/utils/ecs";
import { capitalCase } from "change-case";
import { Vector3 } from "three";
import { beforeEach, describe, expect, it } from "vitest";

let ship: Entity;
const systems: Record<string, Entity> = {};
beforeEach(() => {
	const ecs = new ECS({} as any);
	ship = new Entity(null, { isShip: {}, shipSystems: {} });
	ecs.addEntity(ship);

	Object.keys(ShipSystemTypes).forEach((sys) => {
		if (sys === "generic") return;
		const comp = `is${capitalCase(sys)}`.replace(" ", "");
		const entity = new Entity(null, {
			damage: {},
			[comp]: {},
			isShipSystem: { shipId: ship.id, type: sys as any },
		});
		ecs.addEntity(entity);
		systems[sys] = entity;
		ship.components.shipSystems?.shipSystems.set(entity.id, {});
	});
});

function checkSystems() {
	expect(systems.shields.components.damage?.efficiency).toEqual(1);
	expect(systems.shields.components.damage?.failureRisk).toEqual(0);
	expect(systems.shields.components.damage?.cascadeRisk).toEqual(0);
	expect(systems.coolantTank.components.damage?.efficiency).toEqual(1);
	expect(systems.coolantTank.components.damage?.failureRisk).toEqual(0);
	expect(systems.mainComputer.components.damage?.efficiency).toEqual(1);
	expect(systems.mainComputer.components.damage?.instability).toEqual(0);
	expect(systems.mainComputer.components.damage?.failureRisk).toEqual(0);
}
describe.skip("applyDamage", () => {
	it("should apply damage to a handful of systems", () => {
		checkSystems();
		// A torpedo impact
		applyDamage(ship, 1, new Vector3(0, 0, -1));
		expect(systems.shields.components.damage?.failureRisk).toBeCloseTo(0.002);
		expect(systems.shields.components.damage?.cascadeRisk).toBeCloseTo(0.1654);
		expect(systems.coolantTank.components.damage?.efficiency).toBeCloseTo(
			0.731,
		);
		expect(systems.coolantTank.components.damage?.failureRisk).toBeCloseTo(
			0.001,
		);
		expect(systems.mainComputer.components.damage?.efficiency).toBeCloseTo(
			0.9812,
		);
		expect(systems.mainComputer.components.damage?.instability).toBeCloseTo(
			0.000807,
		);
		expect(systems.mainComputer.components.damage?.failureRisk).toBeCloseTo(
			0.0017,
		);
	});
	// Note that the same systems were affected, thanks to the RNG, but the
	// effect is much smaller due to the shields
	it("should apply less damage to systems when shields are raised", () => {
		checkSystems();
		systems.shields.updateComponent("isShields", { state: "up", strength: 5 });
		applyDamage(ship, 1, new Vector3(0, 0, 1));

		expect(systems.shields.components.damage?.failureRisk).toBeCloseTo(0.002);
		expect(systems.shields.components.damage?.cascadeRisk).toBeCloseTo(0.0045);
		expect(systems.coolantTank.components.damage?.efficiency).toBeCloseTo(
			0.9925,
		);
		expect(systems.coolantTank.components.damage?.failureRisk).toBeCloseTo(
			0.001,
		);
		expect(systems.mainComputer.components.damage?.efficiency).toBeCloseTo(
			0.999,
		);
		expect(systems.mainComputer.components.damage?.instability).toBeCloseTo(
			0.0004,
		);
		expect(systems.mainComputer.components.damage?.failureRisk).toBeCloseTo(
			0.0017,
		);
	});
	// Targeting took more damage than normal, shields took less
	it("should apply extra damage to systems that are weak to the damage type", () => {
		checkSystems();
		systems.shields.updateComponent("damage", {
			damageTypeMultipliers: { Electrical: 2 },
		});
		systems.coolantTank.updateComponent("damage", {
			damageTypeMultipliers: { Electrical: 0.5 },
		});

		applyDamage(ship, 1, new Vector3(0, 0, 1), ["Electrical"]);

		expect(systems.shields.components.damage?.failureRisk).toBeCloseTo(0.002);
		expect(systems.shields.components.damage?.cascadeRisk).toBeCloseTo(0.2481);
		expect(systems.coolantTank.components.damage?.efficiency).toBeCloseTo(
			0.798,
		);
		expect(systems.coolantTank.components.damage?.failureRisk).toBeCloseTo(
			0.001,
		);
		expect(systems.mainComputer.components.damage?.efficiency).toBeCloseTo(
			0.9812,
		);
		expect(systems.mainComputer.components.damage?.instability).toBeCloseTo(
			0.000807,
		);
		expect(systems.mainComputer.components.damage?.failureRisk).toBeCloseTo(
			0.0017,
		);
	});
	it("should apply extra damage to systems that are vulnerable", () => {
		systems.thrusters.updateComponent("damage", {
			vulnerability: "vulnerable",
		});
		applyDamage(ship, 1, new Vector3(0, 0, 1), ["Electrical"]);
		expect(systems.targeting.components.damage?.efficiency).toEqual(1);
		expect(systems.targeting.components.damage?.failureRisk).toEqual(0);
		expect(systems.targeting.components.damage?.cascadeRisk).toEqual(0);

		expect(systems.thrusters.components.damage?.failureRisk).toBeCloseTo(0.002);
		expect(systems.thrusters.components.damage?.cascadeRisk).toBeCloseTo(
			0.1654,
		);
	});
	it("should apply no damage to systems that are invulnerable", () => {
		systems.shields.updateComponent("damage", {
			vulnerability: "invulnerable",
		});
		applyDamage(ship, 1, new Vector3(0, 0, 1), ["Electrical"]);

		expect(systems.shields.components.damage?.efficiency).toEqual(1);
		expect(systems.shields.components.damage?.cascadeRisk).toEqual(0);
		expect(systems.shields.components.damage?.instability).toEqual(0);

		expect(systems.phasers.components.damage?.failureRisk).toBeCloseTo(0.002);
		expect(systems.phasers.components.damage?.cascadeRisk).toBeCloseTo(0.1654);
	});
});
