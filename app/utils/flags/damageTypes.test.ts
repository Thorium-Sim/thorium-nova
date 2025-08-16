import { ECS, Entity } from "@thorium/utils/ecs";
import {
	getAggregateDamage,
	getReportEffects,
} from "@thorium/utils/flags/damageTypes";
import { it, expect, beforeEach, describe } from "vitest";
let system: Entity;
let otherSystem: Entity;

describe("getReportEffects", () => {
	beforeEach(() => {
		const ecs = new ECS({} as any);
		const ship = new Entity();
		ship.addComponent("isShip");
		ecs.addEntity(ship);
		system = new Entity();
		system.addComponent("isShipSystem", {
			type: "impulseEngines",
			shipId: ship.id,
		});
		system.addComponent("damage", {
			efficiency: 0.7,
			heatMultiplier: 1.1,
			cascadeRisk: 0.2,
			signature: 0.8,
		});
		ecs.addEntity(system);

		otherSystem = new Entity();
		otherSystem.addComponent("isShipSystem", {
			type: "warpEngines",
			shipId: ship.id,
		});
		otherSystem.addComponent("damage", {
			efficiency: 0.7,
			heatMultiplier: 1.1,
			cascadeRisk: 0.2,
			signature: 0.8,
		});
		ecs.addEntity(otherSystem);

		ship.addComponent("shipSystems", {
			shipSystems: new Map([
				[system.id, {}],
				[otherSystem.id, {}],
			]),
		});
	});

	it("should generate reasonable damage report effects", () => {
		const effects1 = getReportEffects(system);
		expect(effects1.get(system.id)).toMatchInlineSnapshot(`
		{
		  "efficiency": 0.049242199037513285,
		  "failureRisk": 0.03713062238812694,
		  "signature": 0.05023621196165593,
		}
	`);
		const effects2 = getReportEffects(system);
		expect(effects2.get(system.id)).toMatchInlineSnapshot(`
		{
		  "efficiency": 0.04736061674714103,
		}
	`);
		expect(effects2.get(otherSystem.id)).toMatchInlineSnapshot(`
		{
		  "crewSafetyRating": 0.044051105306495704,
		}
	`);
	});
	it("should generate negative side effects", () => {
		const effects1 = getReportEffects(system, "efficiency", "negative");
		expect(effects1.get(system.id)).toMatchInlineSnapshot(`
		{
		  "efficiency": 0.049242199037513285,
		  "failureRisk": 0.0003341756014931425,
		  "signature": 0.04521259076549034,
		}
	`);
		const effects2 = getReportEffects(system, "efficiency", "negative");
		expect(effects2.get(system.id)).toMatchInlineSnapshot(`
		{
		  "efficiency": 0.04736061674714103,
		}
	`);
		expect(effects2.get(otherSystem.id)).toMatchInlineSnapshot(`
		{
		  "crewSafetyRating": 0.019822997387923067,
		}
	`);
	});
	it("should generate positive side effects", () => {
		const effects1 = getReportEffects(system, "efficiency", "positive");
		expect(effects1.get(system.id)).toMatchInlineSnapshot(`
		{
		  "efficiency": 0.049242199037513285,
		  "failureRisk": -0.00037130622388126944,
		  "signature": -0.05023621196165593,
		}
	`);
		const effects2 = getReportEffects(system, "efficiency", "positive");
		expect(effects2.get(system.id)).toMatchInlineSnapshot(`
		{
		  "efficiency": 0.04736061674714103,
		}
	`);
		expect(effects2.get(otherSystem.id)).toMatchInlineSnapshot(`
		{
		  "crewSafetyRating": -0.022025552653247852,
		}
	`);
	});
	it("should generate different primary effects", () => {
		const effects1 = getReportEffects(system, "heatMultiplier");
		expect(effects1.get(system.id)).toMatchInlineSnapshot(`
		{
		  "failureRisk": 0.03713062238812694,
		  "heatMultiplier": -0.049242199037513285,
		  "signature": 0.05023621196165593,
		}
	`);
		const effects2 = getReportEffects(system, "cascadeRisk");
		expect(effects2.get(system.id)).toMatchInlineSnapshot(`
		{
		  "cascadeRisk": -0.04736061674714103,
		}
	`);
		expect(effects2.get(otherSystem.id)).toMatchInlineSnapshot(`
		{
		  "crewSafetyRating": 0.044051105306495704,
		}
	`);
	});
});
describe("getAggregateDamage", () => {
	it("should combine damage together based on the weight of all damage aspects.", () => {
		const sys = new Entity();
		sys.addComponent("damage");
		expect(getAggregateDamage(sys)).toEqual(0);

		sys.updateComponent("damage", {
			efficiency: 0,
		});
		// One component is worth exactly 1/7 of the total damage.
		// Might change this to weigh certain damage more or less than others
		expect(getAggregateDamage(sys)).toBeCloseTo(1 / 7);

		sys.updateComponent("damage", {
			cascadeRisk: 1,
			crewSafetyRating: 0.5,
			failureRisk: 0.01,
			heatMultiplier: 2,
			signature: 1,
			instability: 0.25,
		});
		expect(getAggregateDamage(sys)).toBeCloseTo(1);

		sys.updateComponent("damage", {
			efficiency: 0.5,
			cascadeRisk: 0.5,
			crewSafetyRating: 0.25,
			failureRisk: 0.005,
			heatMultiplier: 1.5,
			signature: 0.5,
			instability: 0.125,
		});
		expect(getAggregateDamage(sys)).toBeCloseTo(0.5);
	});
});
