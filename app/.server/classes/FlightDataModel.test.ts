import {
	createMockDataContext,
	createMockRouter,
	MockDataContext,
} from "@thorium/utils/.server/createMockDataContext";
import {
	DataStore,
	type DataStoreOperations,
} from "@thorium/utils/.server/db-fs";
import { aroundEach, expect, test } from "vitest";
import { Entity } from "@thorium/utils/ecs";
import { dump } from "js-yaml";
import type { DatabaseContext } from "@thorium/typeguards/isDatabaseContext";

const fileMap = new Map<string, string>();
const testDataStoreProps: DataStoreOperations = {
	database: {} as DatabaseContext,
	async getData() {
		return "";
	},
	async getAssetUrl() {
		return "";
	},
	async readAsset(assetPath) {
		const key = assetPath.split("/").at(-1)?.replace(".yml", "");
		const asset = fileMap.get(key || "");
		return dump(JSON.parse(asset || "") || "");
	},
	async remove() {},
	async removeAsset() {},
	async uploadAsset(asset, fileName) {
		return "";
	},
	async write(force, name) {
		fileMap.set(name || this.meta.flightName, JSON.stringify(this.toJSON()));
	},
	async loadAllAspects(aspectClasses) {},
	async rename(newName, otherNames) {},

	async getFlights() {
		return [];
	},
	async getFlightSnapshots(flightName) {
		return Array.from(fileMap.keys());
	},
};

aroundEach(async (runTest) => {
	await DataStore.operations.run(testDataStoreProps, async () => {
		runTest();
	});
});

test("snapshot", async () => {
	const dataContext = createMockDataContext();
	const database = DataStore.operations.getStore()!.database;
	const router = createMockRouter(dataContext);

	expect(database.flight?.ecs.entities.size).toEqual(0);
	await router.flight.snapshot({ name: "Snapshot 1" });

	const entity = new Entity();
	entity.addComponent("isShip");
	database.flight?.ecs.addEntity(entity);
	expect(database.flight?.ecs.entities.size).toEqual(1);

	await router.flight.snapshot({ name: "Snapshot 2" });
	await router.flight.restoreSnapshot({ name: "Snapshot 1" });
	expect(database.flight?.ecs.entities.size).toEqual(0);

	await router.flight.restoreSnapshot({ name: "Snapshot 2" });

	expect(database.flight?.ecs.entities.size).toEqual(1);
});
