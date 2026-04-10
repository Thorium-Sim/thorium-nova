import { createMockDataContext } from "@thorium/utils/.server/createMockDataContext";
import { DataStore } from "@thorium/utils/.server/db-fs";
import { testDataStoreProps } from "@thorium/utils/.server/db-fs/testDataStoreProps";
import { executeBlocks } from "@thorium/utils/.server/executeBlocks";
import { Entity } from "@thorium/utils/ecs";
import { expect, it, aroundEach } from "vitest";
import { scheduleAction } from "./scheduleAction";

aroundEach(async (runTest) => {
	await DataStore.operations.run(testDataStoreProps, async () => {
		await runTest();
	});
});

// Due to some weirdness with how data is stored,
// this test file can only include a single test.
// Sorry for the inconvenience
it("should perform simple actions", async () => {
	const dataContext = createMockDataContext();
	DataStore.operations.getStore()!.database = {
		server: dataContext.server,
		flight: dataContext.flight,
	};
	const database = DataStore.operations.getStore()!.database;
	const ecs = database.flight!.ecs;

	const ship = new Entity();
	ship.addComponent("isShip");
	ship.addComponent("isPlayerShip");
	ship.addComponent("tags", { tags: ["player"] });
	ecs.addEntity(ship);
	expect(ship.components.isShip?.alertLevel).toEqual("5");
	await executeBlocks(ecs, [
		{
			id: "1",
			type: "EntityPropertyIntoVariable",
			entity: "#player",
			component: "id",
			variable: "shipId",
			property: "",
		},
		{
			id: "2",
			type: "Action",
			action: "alertLevel.update",
			values: { shipId: "$shipId", alertLevel: "2" },
		},
	]);
	expect(ship.components.isShip?.alertLevel).toEqual("2");

	const flightClient = new Entity();
	flightClient.updateComponent("flightClient", {
		clientId: "thorium",
		shipId: ship.id,
		flightId: database.flight?.name,
	});
	ecs.addEntity(flightClient);

	await executeBlocks(ecs, [
		{
			id: "1",
			type: "Action",
			action: "remoteAccess.send",
			values: {
				clientId: "thorium",
				code: "testing",
			},
		},
		{
			id: "2",
			type: "ResultPropertyIntoVariable",
			property: "remoteAccessCodeId",
			variable: "codeId",
		},
		{
			id: "3",
			type: "EntityPropertyIntoVariable",
			entity: "$codeId",
			component: "remoteAccessCode",
			property: "shipId",
			variable: "ship",
		},
		{
			id: "4",
			type: "EntityPropertyIntoVariable",
			entity: "$codeId",
			component: "remoteAccessCode",
			property: "code",
			variable: "code",
		},
		{
			id: "5",
			type: "IfCondition",
			conditions: [{ value1: "$code", value2: "testing", comparison: "=" }],
			triggerBlocks: [
				{
					id: "2",
					type: "Action",
					action: "alertLevel.update",
					values: { shipId: "$ship", alertLevel: "4" },
				},
			],
		},
		{
			id: "5",
			type: "IfCondition",
			conditions: [{ value1: "$code", value2: "nottesting", comparison: "=" }],
			triggerBlocks: [
				{
					id: "2",
					type: "Action",
					action: "alertLevel.update",
					values: { shipId: "$ship", alertLevel: "3" },
				},
			],
		},
	]);
	expect(ship.components.isShip?.alertLevel).toEqual("4");

	ship.updateComponent("variables", {
		variables: [{ type: "any", name: "val", value: "1" }],
	});

	await executeBlocks(ecs, [
		{
			id: "1",
			type: "VariableIntoVariable",
			entity: "#player",
			getVariable: "val",
			variable: "level",
		},
		{
			id: "2",
			type: "Action",
			action: "alertLevel.update",
			values: { shipId: "1", alertLevel: "$level" },
		},
	]);

	expect(ship.components.isShip?.alertLevel).toEqual("1");

	await executeBlocks(ecs, [
		{
			id: "1",
			type: "RandomIntoVariable",
			number1: "1",
			number2: "5",
			numberType: "integer",
			variable: "level",
		},
		{
			id: "2",
			type: "Action",
			action: "alertLevel.update",
			values: { shipId: "1", alertLevel: "$level" },
		},
	]);
	expect(ship.components.isShip?.alertLevel).toEqual("2");
	await executeBlocks(ecs, [
		{
			id: "1",
			type: "RandomIntoVariable",
			number1: "1",
			number2: "5",
			numberType: "integer",
			variable: "level",
		},
		{
			id: "1.1",
			type: "MathIntoVariable",
			number1: "$level",
			number2: "3",
			operation: "+",
			variable: "level",
		},
		{
			id: "2",
			type: "Action",
			action: "alertLevel.update",
			values: { shipId: "1", alertLevel: "$level" },
		},
	]);
	expect(ship.components.isShip?.alertLevel).toEqual("4");

	await executeBlocks(ecs, [
		{
			id: "1",
			type: "EntityPropertyIntoVariable",
			entity: "#player",
			component: "id",
			variable: "shipId",
			property: "",
		},
		{
			id: "1.1",
			type: "Wait",
			unit: "milliseconds",
			time: 1000,
		},
		{
			id: "2",
			type: "Action",
			action: "alertLevel.update",
			values: { shipId: "$shipId", alertLevel: "2" },
		},
	]);
	// The wait condition hasn't finished executing.
	expect(ship.components.isShip?.alertLevel).toEqual("4");
	ecs.update(1000);
	// Wait until the next tick to allow the async function to flush
	await new Promise((res) => process.nextTick(res));
	expect(ship.components.isShip?.alertLevel).toEqual("2");

	// Properly test scheduleAction
	scheduleAction(
		ecs,
		"alertLevel.update",
		{ alertLevel: "1", shipId: 1 },
		1000,
	);
	expect(ship.components.isShip?.alertLevel).toEqual("2");
	ecs.update(1000);
	await new Promise((res) => process.nextTick(res));
	expect(ship.components.isShip?.alertLevel).toEqual("1");
});
