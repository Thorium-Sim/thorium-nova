import { ECS, Entity } from "@thorium/utils/ecs";
import { getReportEffects } from "@thorium/utils/flags/damageTypes";
import { it, expect, beforeEach } from "vitest";
let system: Entity;
beforeEach(() => {
	const ecs = new ECS({} as any);
	system = new Entity();
	system.addComponent("damage", {
		efficiency: 0.7,
		heatMultiplier: 1.1,
		cascadeRisk: 0.2,
		signature: 0.8,
	});
	ecs.addEntity(system);
});

it("should generate reasonable damage report effects", () => {
	expect(getReportEffects(system)).toMatchInlineSnapshot(`
		{
		  "cascadeRisk": -0.07173778462962661,
		  "efficiency": 0.049242199037513285,
		  "heatMultiplier": 0.006743309182753627,
		}
	`);
	expect(getReportEffects(system)).toMatchInlineSnapshot(`
		{
		  "efficiency": 0.05023621196165593,
		  "failureRisk": 0.04736061674714103,
		}
	`);
});
it("should generate negative side effects", () => {
	expect(
		getReportEffects(system, "efficiency", "negative"),
	).toMatchInlineSnapshot(`
		{
		  "cascadeRisk": 0.06456400616666395,
		  "efficiency": -0.04431797913376196,
		  "heatMultiplier": 0.006068978264478264,
		}
	`);
	expect(
		getReportEffects(system, "efficiency", "negative"),
	).toMatchInlineSnapshot(`
		{
		  "efficiency": -0.04521259076549034,
		  "failureRisk": 0.04262455507242693,
		}
	`);
});
it("should generate positive side effects", () => {
	expect(
		getReportEffects(system, "efficiency", "positive"),
	).toMatchInlineSnapshot(`
		{
		  "cascadeRisk": -0.07173778462962661,
		  "efficiency": 0.049242199037513285,
		  "heatMultiplier": -0.006743309182753627,
		}
	`);
	expect(
		getReportEffects(system, "efficiency", "positive"),
	).toMatchInlineSnapshot(`
		{
		  "efficiency": 0.05023621196165593,
		  "failureRisk": -0.04736061674714103,
		}
	`);
});
it("should generate different primary effects", () => {
	expect(getReportEffects(system, "heatMultiplier")).toMatchInlineSnapshot(`
		{
		  "cascadeRisk": -0.07173778462962661,
		  "efficiency": 0.006743309182753627,
		  "heatMultiplier": -0.049242199037513285,
		}
	`);
	expect(getReportEffects(system, "cascadeRisk")).toMatchInlineSnapshot(`
		{
		  "cascadeRisk": -0.05023621196165593,
		  "signature": 0.04736061674714103,
		}
	`);
});
