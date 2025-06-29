import { ECS, Entity } from "@thorium/utils/ecs";
import { WarpSystem } from "../WarpSystem";
import { beforeEach, describe, expect, it } from "vitest";
import { createMockDataContext } from "@thorium/utils/.server/createMockDataContext";

describe("WarpSystem", () => {
	let ecs: ECS;
	let warpSystem: WarpSystem;
	beforeEach(() => {
		const mockDataContext = createMockDataContext();

		ecs = new ECS(mockDataContext.server);
		warpSystem = new WarpSystem();
	});
	it("should initialize properly", () => {
		ecs.addSystem(warpSystem);
	});
	it("should properly update an entity with the warp engines component", async () => {
		const ship = new Entity();
		const entity = new Entity();
		entity.addComponent("isWarpEngines");
		entity.addComponent("isShipSystem", {
			shipId: ship.id,
			type: "warpEngines",
		});
		ship.addComponent("isShip");
		ship.addComponent("mass", { mass: 2000 });
		ship.addComponent("position", { type: "solar" });
		ship.addComponent("velocity");
		ship.addComponent("rotation");
		ship.addComponent("shipSystems", {
			shipSystems: new Map([[entity.id, {}]]),
		});

		ecs.addSystem(warpSystem);
		ecs.addEntity(entity);
		ecs.addEntity(ship);
		const engines = entity.components.isWarpEngines;
		expect(engines?.forwardAcceleration).toEqual(0);
		expect(engines?.maxVelocity).toEqual(0);
		ecs.update(1);
		expect(engines?.forwardAcceleration).toEqual(0);
		expect(engines?.maxVelocity).toEqual(0);
		entity.updateComponent("isWarpEngines", { currentWarpFactor: 1 });
		ecs.update(16);
		expect(engines?.forwardAcceleration).toMatchInlineSnapshot(`29980`);
		expect(engines?.maxVelocity).toMatchInlineSnapshot(`299800`);
		ecs.update(1000);
		expect(engines?.forwardAcceleration).toMatchInlineSnapshot(`29980`);
		expect(engines?.maxVelocity).toMatchInlineSnapshot(`299800`);
		entity.updateComponent("isWarpEngines", { currentWarpFactor: 5 });
		ecs.update(1000);
		expect(engines?.forwardVelocity).toMatchInlineSnapshot(`2998479.68`);
		ecs.update(5000);
		expect(engines?.forwardVelocity).toMatchInlineSnapshot(`17838579.68`);

		entity.updateComponent("isWarpEngines", { currentWarpFactor: 0 });
		for (let i = 0; i < 60 * 3; i++) {
			ecs.update(16);
		}
		expect(engines?.forwardAcceleration).toMatchInlineSnapshot(
			`-0.0988217916351965`,
		);
		expect(engines?.forwardVelocity).toMatchInlineSnapshot(
			`0.018183209660876158`,
		);
	});
});
