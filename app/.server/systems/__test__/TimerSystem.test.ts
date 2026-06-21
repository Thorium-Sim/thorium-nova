import { executeBlocks } from "@thorium/utils/.server/executeBlocks";
import { ECS, Entity } from "@thorium/utils/ecs";
import { beforeEach, describe, expect, it } from "vitest";

import { TimerSystem } from "../TimerSystem";

const server: any = {};
describe("TimerSystem", () => {
	let ecs: ECS;
	let timerSystem: TimerSystem;
	beforeEach(() => {
		ecs = new ECS(server);
		ecs.executeBlocks = (blocks, blockMetadata) => executeBlocks(ecs, blocks, blockMetadata);
		timerSystem = new TimerSystem();
	});
	it("should initialize properly", () => {
		ecs.addSystem(timerSystem);
	});
	it("should properly access an entity with the timer system", async () => {
		const entity = new Entity(null, {
			timer: {
				remainingDurationMs: 10 * 60 * 1000,
				label: "Test",
				paused: false,
			},
		});
		entity.updateComponent("timer", { remainingDurationMs: 5 * 60 * 1000 });
		ecs.addSystem(timerSystem);
		ecs.addEntity(entity);
		ecs.update(16);
		ecs.update(1000);
		expect(entity.components.timer?.remainingDurationMs).toBeCloseTo(
			4 * 60 * 1000 + 59 * 1000 - 16,
			0,
		);
	});
	it("should handle when the timer ends", async () => {
		const entity = new Entity(null, {});
		entity.updateComponent("timer", { remainingDurationMs: 1000 });
		ecs.addSystem(timerSystem);
		ecs.addEntity(entity);
		ecs.update(16);
		expect(entity.components.timer?.remainingDurationMs).toBeCloseTo(1000 - 16, 0);
		expect(ecs.entities.size).toEqual(1);
		ecs.update(1000 - 16);
		expect(entity.components.timer?.remainingDurationMs).toBeCloseTo(0);
		expect(ecs.entities.size).toEqual(0);

		entity.updateComponent("timer", { remainingDurationMs: -10 * 1000 });
		ecs.addEntity(entity);
		ecs.update(16);
		expect(ecs.entities.size).toEqual(0);
	});
});
