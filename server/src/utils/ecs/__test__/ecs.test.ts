import ECS from "../ecs";
import Entity from "../entity";
import System from "../system";
import { vi } from "vitest";

const server: any = {};
describe("ECS", () => {
	it("should initialize", () => {
		const ecs = new ECS(server);

		expect(Array.isArray(ecs.entities)).toBeTruthy();
		expect(Array.isArray(ecs.systems)).toBeTruthy();
	});

	describe("getEntityById()", () => {
		it("should retrieve an entity by id", () => {
			const ecs = new ECS(server);
			const entity = new Entity(123, {});

			ecs.addEntity(entity);

			expect(ecs.getEntityById(123)).toEqual(entity);
		});
	});

	describe("update()", () => {
		let ecs: ECS;
		let entity: Entity;
		let system: System;

		beforeEach(() => {
			ecs = new ECS(server);
			entity = new Entity();
			system = new System();
		});

		it("should give the elapsed time to update methods", async () => {
			system.test = () => true;
			const done = new Promise<void>((res) => {
				system.update = (_entity, elapsed) => {
					expect(typeof elapsed).toBe("number");
					res();
				};
			});

			ecs.addSystem(system);
			ecs.addEntity(entity);

			ecs.update();

			await done;
		});
	});

	describe("addSystem()", () => {
		let ecs: ECS;
		let entity: Entity;
		let system: System;

		beforeEach(() => {
			ecs = new ECS(server);
			entity = new Entity();
			system = new System();
		});

		it("should call enter() when update", () => {
			system.test = () => true;
			system.enter = vi.fn();
			ecs.addSystem(system);
			ecs.addEntity(entity);

			ecs.update();

			expect(system.enter).toBeCalledWith(entity);
		});

		it("should call enter() when removing and re-adding a system", () => {
			system.test = () => true;
			system.enter = vi.fn();
			ecs.addSystem(system);
			ecs.addEntity(entity);
			ecs.update();

			ecs.removeSystem(system);
			ecs.update();

			ecs.addSystem(system);
			ecs.update();

			expect(system.enter).toHaveBeenCalledTimes(2);
		});
	});

	describe("removeSystem()", () => {
		let ecs: ECS;
		let entity: Entity;
		let system: System;

		beforeEach(() => {
			ecs = new ECS(server);
			entity = new Entity();
			system = new System();
		});

		it("should call exit(entity) when removed", () => {
			system.test = () => true;
			system.exit = vi.fn();

			ecs.addSystem(system);
			ecs.addEntity(entity);

			ecs.update();

			ecs.removeSystem(system);

			expect(system.exit).toBeCalledWith(entity);
		});

		it("should call exit(entity) of all systems when removed", () => {
			system.test = () => true;
			system.exit = vi.fn();

			ecs.addSystem(system);
			ecs.addEntity(entity);

			ecs.update();

			ecs.removeSystem(system);

			expect(system.exit).toBeCalledWith(entity);
		});
	});

	describe("removeEntity()", () => {
		let ecs: ECS;
		let entity: Entity;
		let system1: System;
		let system2: System;

		beforeEach(() => {
			ecs = new ECS(server);
			entity = new Entity();
			system1 = new System();
			system2 = new System();
		});

		it("should call exit(entity) when removed", () => {
			system1.test = () => true;
			system1.exit = vi.fn();

			ecs.addSystem(system1);
			ecs.addEntity(entity);

			ecs.update();

			ecs.removeEntity(entity);

			expect(system1.exit).toBeCalledWith(entity);
		});

		it("should call exit(entity) of all systems when removed", async () => {
			system2.test = () => true;
			system2.exit = vi.fn();
			system1.test = () => true;
			system1.exit = vi.fn();

			ecs.addSystem(system1);
			ecs.addSystem(system2);
			ecs.addEntity(entity);

			ecs.update();

			ecs.removeEntity(entity);

			expect(system1.exit).toBeCalledWith(entity);
		});
	});
});
