import { ECS, Entity } from "./ecs";
import {
	evaluateAction,
	evaluateEntityQuery,
	evaluateTriggerCondition,
	selectValueQuery,
} from "./evaluateEntityQuery";

const server: any = {};

describe("entity query", () => {
	it("should find an entity by identity", () => {
		const ecs = new ECS(server);

		const entity = new Entity();
		entity.addComponent("identity", {
			name: "Test",
		});
		ecs.addEntity(entity);

		const entity2 = new Entity();
		entity2.addComponent("identity", {
			name: "Test2",
		});
		ecs.addEntity(entity2);

		expect(
			evaluateEntityQuery(ecs, [
				{
					component: "identity",
					property: "name",
					comparison: "=",
					value: "Test",
				},
			]),
		).toEqual([entity]);
		expect(
			evaluateEntityQuery(ecs, [
				{
					component: "identity",
					property: "name",
					comparison: "!=",
					value: "Test",
				},
			]),
		).toEqual([entity2]);
	});
	it("should transform an entity to pull out a single value", () => {
		const ecs = new ECS(server);
		const entity = new Entity();
		entity.addComponent("position", {
			x: 0,
			y: 0,
		});
		entity.addComponent("identity", {
			name: "Test",
		});
		ecs.addEntity(entity);

		const entity2 = new Entity();
		entity2.addComponent("position", {
			x: 0,
			y: 1,
		});
		entity2.addComponent("identity", {
			name: "Test2",
		});
		ecs.addEntity(entity2);

		expect(
			selectValueQuery(ecs, {
				query: [
					{
						component: "identity",
						property: "name",
						comparison: "!=",
						value: "Blah",
					},
				],
				select: { component: "position", property: "y", matchType: "all" },
			}),
		).toEqual([0, 1]);
		expect(
			selectValueQuery(ecs, {
				query: [
					{
						component: "identity",
						property: "name",
						comparison: "!=",
						value: "Blah",
					},
				],
				select: { component: "position", property: "y", matchType: "first" },
			}),
		).toEqual([0]);

		expect(
			selectValueQuery(ecs, {
				query: [
					{
						component: "identity",
						property: "name",
						comparison: "!=",
						value: "Blah",
					},
				],
				select: { component: "identity", property: "name", matchType: "all" },
			}),
		).toEqual(["Test", "Test2"]);
	});
	it("should compare one entity's value to another's", () => {
		const ecs = new ECS(server);
		const entity = new Entity();
		entity.addComponent("position", {
			x: 1,
			y: 0,
		});
		entity.addComponent("identity", {
			name: "Test",
		});
		ecs.addEntity(entity);

		const entity2 = new Entity();
		entity2.addComponent("position", {
			x: 0,
			y: 1,
		});
		entity2.addComponent("identity", {
			name: "Test2",
		});
		ecs.addEntity(entity2);

		expect(
			evaluateEntityQuery(ecs, [
				{
					component: "position",
					property: "y",
					comparison: "=",
					value: {
						query: [
							{
								component: "identity",
								property: "name",
								comparison: "=",
								value: "Test",
							},
						],
						select: {
							component: "position",
							property: "x",
							matchType: "first",
						},
					},
				},
			]),
		).toEqual([entity2]);
	});
	it("should match systems from a ship entity", () => {
		const ecs = new ECS(server);

		const ship = new Entity();
		ship.addComponent("isShip");
		ship.addComponent("isPlayerShip");

		ecs.addEntity(ship);

		const fakeSystem = new Entity();
		fakeSystem.addComponent("isShipSystem", {
			type: "warpEngines",
			shipId: ship.id,
		});
		fakeSystem.addComponent("isWarpEngines");
		ecs.addEntity(fakeSystem);

		const system = new Entity();
		system.addComponent("isShipSystem", {
			type: "impulseEngines",
			shipId: ship.id,
		});
		system.addComponent("isImpulseEngines");
		ecs.addEntity(system);

		const ship2 = new Entity();
		ship2.addComponent("isShip");
		ecs.addEntity(ship2);

		const system2 = new Entity();
		system2.addComponent("isShipSystem", {
			type: "impulseEngines",
			shipId: ship2.id,
		});
		system2.addComponent("isImpulseEngines");
		ecs.addEntity(system2);

		expect(
			evaluateEntityQuery(ecs, [
				{
					component: "isShipSystem",
					property: "shipId",
					comparison: "=",
					value: {
						query: [
							// @ts-expect-error
							{
								component: "isPlayerShip",
								property: "isPresent",
							},
						],

						// @ts-expect-error
						select: { component: "id", matchType: "first" },
					},
				},
				// @ts-expect-error
				{
					component: "isImpulseEngines",
					property: "isPresent",
				},
			]),
		).toEqual([system]);
	});
});

describe("evaluate trigger condition", () => {
	it("should evaluate a match condition", () => {
		const ecs = new ECS(server);

		const entity = new Entity();
		entity.addComponent("identity", {
			name: "Testing",
		});
		ecs.addEntity(entity);

		const entity2 = new Entity();
		entity2.addComponent("identity", {
			name: "Test2",
		});
		ecs.addEntity(entity2);

		const condition = [
			{
				type: "entityMatch" as const,
				matchCount: ">=1",
				query: [
					{
						component: "identity",
						property: "name",
						comparison: "=",
						value: "Test",
					},
				],
			},
		];
		expect(evaluateTriggerCondition(ecs, condition)).toEqual(false);

		entity.updateComponent("identity", { name: "Test" });

		expect(evaluateTriggerCondition(ecs, condition)).toEqual(true);
	});
	it("should evaluate multiple match conditions", () => {
		const ecs = new ECS(server);

		const entity = new Entity();
		entity.addComponent("identity", {
			name: "Test",
		});
		ecs.addEntity(entity);

		const entity2 = new Entity();
		entity2.addComponent("identity", {
			name: "Test",
		});
		ecs.addEntity(entity2);

		const condition = [
			{
				type: "entityMatch" as const,
				matchCount: ">=1",
				query: [
					{
						component: "identity",
						property: "name",
						comparison: "=",
						value: "Test",
					},
				],
			},
			{
				type: "entityMatch" as const,
				matchCount: ">=1",
				query: [
					{
						component: "isPlayerShip",
						property: "isPresent",
					},
				],
			},
		];
		expect(evaluateTriggerCondition(ecs, condition as any)).toEqual(false);

		entity.addComponent("isPlayerShip");

		expect(evaluateTriggerCondition(ecs, condition as any)).toEqual(true);
	});
	it("should evaluate distance conditions", () => {
		const ecs = new ECS(server);

		const ship = new Entity();

		const entity = new Entity();
		entity.addComponent("position", {
			x: 0,
			y: 0,
			type: "ship",
			parentId: ship.id,
		});
		entity.addComponent("identity", {
			name: "Test",
		});
		ecs.addEntity(entity);

		const entity2 = new Entity();
		entity2.addComponent("position", {
			x: 0,
			y: 100,
			type: "ship",
			parentId: ship.id,
		});
		entity2.addComponent("identity", {
			name: "Test2",
		});
		ecs.addEntity(entity2);
		const entity3 = new Entity();
		entity3.addComponent("position", {
			x: 0,
			y: 50,
			type: "ship",
			parentId: ship.id,
		});
		entity3.addComponent("identity", {
			name: "Test2",
		});
		ecs.addEntity(entity3);

		const condition = [
			{
				type: "distance" as const,
				entityA: [
					{
						component: "identity",
						property: "name",
						comparison: "=",
						value: "Test",
					},
				],
				entityB: [
					{
						component: "identity",
						property: "name",
						comparison: "=",
						value: "Test2",
					},
				],
				distance: 200,
				condition: "lessThan",
			},
		];
		expect(evaluateTriggerCondition(ecs, condition as any)).toEqual(true);
		condition[0].distance = 75;
		expect(evaluateTriggerCondition(ecs, condition as any)).toEqual(true);
		condition[0].distance = 25;
		expect(evaluateTriggerCondition(ecs, condition as any)).toEqual(false);
		condition[0].condition = "greaterThan";
		expect(evaluateTriggerCondition(ecs, condition as any)).toEqual(true);
		condition[0].distance = 75;
		expect(evaluateTriggerCondition(ecs, condition as any)).toEqual(true);
		condition[0].distance = 150;
		expect(evaluateTriggerCondition(ecs, condition as any)).toEqual(false);
	});
	it("should evaluate event listener conditions", () => {
		const ecs = new ECS(server);

		expect(
			evaluateTriggerCondition(ecs, [
				{
					type: "eventListener",
					event: "test",
				},
			]),
		).toBe(false);
		expect(
			evaluateTriggerCondition(
				ecs,
				[
					{
						type: "eventListener",
						event: "test",
					},
				],
				{
					event: "blah",
					values: {},
				},
			),
		).toBe(false);
		expect(
			evaluateTriggerCondition(
				ecs,
				[
					{
						type: "eventListener",
						event: "test",
					},
				],
				{
					event: "test",
					values: {},
				},
			),
		).toBe(true);
		expect(
			evaluateTriggerCondition(
				ecs,
				[
					{
						type: "eventListener",
						event: "test",
						values: {
							test: "test",
						},
					},
				],
				{
					event: "test",
					values: {
						test: "Whatever",
						other: true,
					},
				},
			),
		).toBe(false);
		expect(
			evaluateTriggerCondition(
				ecs,
				[
					{
						type: "eventListener",
						event: "test",
						values: {
							test: "test",
						},
					},
				],
				{
					event: "test",
					values: {
						test: "test",
						other: true,
					},
				},
			),
		).toBe(true);
	});
});
describe("evaluate action", () => {
	it("should evaluate an action with literal values", () => {
		const ecs = new ECS(server);

		expect(
			evaluateAction(ecs, {
				action: "test",
				values: { value1: "A", value2: "2" },
				name: "test",
				id: "test",
			}),
		).toEqual([{ value1: "A", value2: "2" }]);
	});
	it("should evaluate an action with a single value query", () => {
		const ecs = new ECS(server);

		const entity = new Entity();
		entity.addComponent("identity", {
			name: "Identity",
		});
		entity.addComponent("tags", {
			tags: ["test"],
		});
		ecs.addEntity(entity);

		expect(
			evaluateAction(ecs, {
				action: "test",
				values: {
					value1: {
						query: [
							{
								component: "tags",
								property: "tags",
								comparison: "contains",
								value: "test",
							},
						],
						select: {
							component: "identity",
							property: "name",
							matchType: "first",
						},
					},
					value2: "2",
				},
				name: "test",
				id: "test",
			}),
		).toEqual([{ value1: "Identity", value2: "2" }]);
	});
	it("should evaluate an action with a multiple value query", () => {
		const ecs = new ECS(server);

		const entity = new Entity();
		entity.addComponent("identity", {
			name: "Identity 1",
		});
		entity.addComponent("tags", {
			tags: ["test"],
		});
		ecs.addEntity(entity);
		const entity2 = new Entity();
		entity2.addComponent("identity", {
			name: "Identity 2",
		});
		entity2.addComponent("tags", {
			tags: ["test"],
		});
		ecs.addEntity(entity2);

		expect(
			evaluateAction(ecs, {
				action: "test",
				values: {
					value1: {
						query: [
							{
								component: "tags",
								property: "tags",
								comparison: "contains",
								value: "test",
							},
						],
						select: {
							component: "identity",
							property: "name",
							matchType: "first",
						},
					},
					value2: "2",
				},
				name: "test",
				id: "test",
			}),
		).toEqual([{ value1: "Identity 1", value2: "2" }]);

		expect(
			evaluateAction(ecs, {
				action: "test",
				values: {
					value1: {
						query: [
							{
								component: "tags",
								property: "tags",
								comparison: "contains",
								value: "test",
							},
						],
						select: {
							component: "identity",
							property: "name",
							matchType: "all",
						},
					},
					value2: "2",
				},
				name: "test",
				id: "test",
			}),
		).toEqual([
			{ value1: "Identity 1", value2: "2" },
			{ value1: "Identity 2", value2: "2" },
		]);
	});
});
