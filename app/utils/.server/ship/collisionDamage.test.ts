import { ShipSystemTypes } from "@thorium/.server/classes/Plugins/ShipSystems/shipSystemTypes";
import { applyDamage } from "@thorium/utils/.server/ship/collisionDamage";
import { ECS, Entity } from "@thorium/utils/ecs";
import { capitalCase } from "change-case";
import { Vector3 } from "three";
import { beforeEach, expect, it } from "vitest";

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
	expect(systems.targeting.components.damage?.efficiency).toEqual(1);
	expect(systems.targeting.components.damage?.failureRisk).toEqual(0);
	expect(systems.targeting.components.damage?.cascadeRisk).toEqual(0);
	expect(systems.shields.components.damage?.efficiency).toEqual(1);
	expect(systems.shields.components.damage?.cascadeRisk).toEqual(0);
	expect(systems.shields.components.damage?.instability).toEqual(0);
	expect(systems.warpEngines.components.damage?.efficiency).toEqual(1);
	expect(systems.warpEngines.components.damage?.crewSafetyRating).toEqual(0);
}
it("should apply damage to a handful of systems", () => {
	checkSystems();
	// A torpedo impact
	applyDamage(ship, 1, new Vector3(0, 0, -1));

	expect(systems.targeting.components.damage?.efficiency).toBeCloseTo(0.7999);
	expect(systems.targeting.components.damage?.failureRisk).toBeCloseTo(0.1137);
	expect(systems.targeting.components.damage?.cascadeRisk).toBeCloseTo(0.0516);
	expect(systems.shields.components.damage?.efficiency).toBeCloseTo(0.506082);
	expect(systems.shields.components.damage?.cascadeRisk).toBeCloseTo(0.0284);
	expect(systems.shields.components.damage?.instability).toBeCloseTo(0.0901);
	expect(systems.warpEngines.components.damage?.efficiency).toBeCloseTo(0.9846);
	expect(systems.warpEngines.components.damage?.crewSafetyRating).toBeCloseTo(
		0.00667,
	);
});
// Note that the same systems were affected, thanks to the RNG, but the
// effect is much smaller due to the shields
it("should apply less damage to systems when shields are raised", () => {
	checkSystems();
	systems.shields.updateComponent("isShields", { state: "up", strength: 5 });
	applyDamage(ship, 1, new Vector3(0, 0, 1));

	expect(systems.targeting.components.damage?.efficiency).toBeCloseTo(0.9944);
	expect(systems.targeting.components.damage?.failureRisk).toBeCloseTo(0.0031);
	expect(systems.shields.components.damage?.efficiency).toBeCloseTo(0.9862);
	expect(systems.shields.components.damage?.cascadeRisk).toBeCloseTo(0.0007);
	expect(systems.shields.components.damage?.instability).toBeCloseTo(0.002);
	expect(systems.warpEngines.components.damage?.efficiency).toBeCloseTo(0.9995);
	expect(systems.warpEngines.components.damage?.crewSafetyRating).toBeCloseTo(
		0.00018,
	);
});
// Targeting took more damage than normal, shields took less
it("should apply extra damage to systems that are weak to the damage type", () => {
	checkSystems();
	systems.targeting.updateComponent("damage", {
		damageMultipliers: { Electrical: 2 },
	});
	systems.shields.updateComponent("damage", {
		damageMultipliers: { Electrical: 0.5 },
	});

	applyDamage(ship, 1, new Vector3(0, 0, 1), ["Electrical"]);

	expect(systems.targeting.components.damage?.efficiency).toBeCloseTo(0.6998);
	expect(systems.targeting.components.damage?.failureRisk).toBeCloseTo(0.1706);
	expect(systems.targeting.components.damage?.cascadeRisk).toBeCloseTo(0.0774);
	expect(systems.shields.components.damage?.efficiency).toBeCloseTo(0.6295);
	expect(systems.shields.components.damage?.cascadeRisk).toBeCloseTo(0.0213);
	expect(systems.shields.components.damage?.instability).toBeCloseTo(0.0676);
	expect(systems.warpEngines.components.damage?.efficiency).toBeCloseTo(0.9846);
	expect(systems.warpEngines.components.damage?.crewSafetyRating).toBeCloseTo(
		0.00667,
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

	expect(systems.thrusters.components.damage?.efficiency).toBeCloseTo(0.7999);
	expect(systems.thrusters.components.damage?.failureRisk).toBeCloseTo(0.1137);
	expect(systems.thrusters.components.damage?.cascadeRisk).toBeCloseTo(0.0516);
});
it("should apply no damage to systems that are invulnerable", () => {
	systems.shields.updateComponent("damage", {
		vulnerability: "invulnerable",
	});
	applyDamage(ship, 1, new Vector3(0, 0, 1), ["Electrical"]);

	expect(systems.shields.components.damage?.efficiency).toEqual(1);
	expect(systems.shields.components.damage?.cascadeRisk).toEqual(0);
	expect(systems.shields.components.damage?.instability).toEqual(0);

	expect(systems.phasers.components.damage?.efficiency).toBeCloseTo(0.506082);
	expect(systems.phasers.components.damage?.cascadeRisk).toBeCloseTo(0.0284);
	expect(systems.phasers.components.damage?.instability).toBeCloseTo(0.0901);
});
