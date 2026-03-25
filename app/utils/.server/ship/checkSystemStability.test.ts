import { checkSystemStability } from "@thorium/utils/.server/ship/checkSystemStability";
import { ECS, Entity } from "@thorium/utils/ecs";
import { LiveQueryError } from "@thorium/utils/live-query/client/client";
import { beforeEach, describe, expect, it, vi } from "vitest";

let system: Entity;
let ecs: ECS;

beforeEach(() => {
	ecs = new ECS({} as any);
	system = new Entity(null, { damage: {} });
	ecs.addEntity(system);
});

describe("checkSystemStability", () => {
	it("does not throw and does not call RNG when instability is 0", () => {
		system.updateComponent("damage", { instability: 0 });
		const spy = vi.spyOn(ecs.rng, "nextAsPercentage");

		expect(() => checkSystemStability(system)).not.toThrow();
		expect(spy).not.toHaveBeenCalled();
	});

	it("does not throw when roll clears the instability threshold", () => {
		system.updateComponent("damage", { instability: 0.4 });
		vi.spyOn(ecs.rng, "nextAsPercentage").mockReturnValue(0.6);

		expect(() => checkSystemStability(system)).not.toThrow();
	});

	it("throws LiveQueryError when roll is below the instability threshold", () => {
		system.updateComponent("damage", { instability: 0.4 });
		vi.spyOn(ecs.rng, "nextAsPercentage").mockReturnValue(0.2);

		expect(() => checkSystemStability(system)).toThrow(LiveQueryError);
	});

	it("thrown error has the expected message", () => {
		system.updateComponent("damage", { instability: 0.4 });
		vi.spyOn(ecs.rng, "nextAsPercentage").mockReturnValue(0.2);

		expect(() => checkSystemStability(system)).toThrow(
			"System instability caused the command to fail. Please try again.",
		);
	});

	it("calls RNG exactly once per check when instability is greater than 0", () => {
		system.updateComponent("damage", { instability: 0.4 });
		const spy = vi.spyOn(ecs.rng, "nextAsPercentage").mockReturnValue(0.6);

		checkSystemStability(system);

		expect(spy).toHaveBeenCalledTimes(1);
	});

	it("calls RNG exactly once even on a failing check", () => {
		system.updateComponent("damage", { instability: 0.4 });
		const spy = vi.spyOn(ecs.rng, "nextAsPercentage").mockReturnValue(0.2);

		try {
			checkSystemStability(system);
		} catch {
			// expected
		}

		expect(spy).toHaveBeenCalledTimes(1);
	});

	it("uses a fresh roll on each successive check", () => {
		system.updateComponent("damage", { instability: 0.4 });
		vi.spyOn(ecs.rng, "nextAsPercentage")
			.mockReturnValueOnce(0.6) // first check passes
			.mockReturnValueOnce(0.6) // second check passes
			.mockReturnValueOnce(0.2); // third check fails

		expect(() => checkSystemStability(system)).not.toThrow();
		expect(() => checkSystemStability(system)).not.toThrow();
		expect(() => checkSystemStability(system)).toThrow(LiveQueryError);
	});
});
