import type { DatabaseContext } from "@thorium/typeguards/isDatabaseContext";
import {
	createMockDataContext,
	createMockRouter,
} from "@thorium/utils/.server/createMockDataContext";
import { DataStore, type DataStoreOperations } from "@thorium/utils/.server/db-fs";
import { Entity } from "@thorium/utils/ecs";
import { dump } from "js-yaml";
import { aroundEach, expect, test } from "vitest";

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
	async uploadAsset() {
		return "";
	},
	async write(_, name) {
		fileMap.set(name || this.meta.flightName, JSON.stringify(this.toJSON()));
	},
	async loadAllAspects() {},
	async rename() {},

	async getFlights() {
		return [];
	},
	async getFlightSnapshots() {
		return Array.from(fileMap.keys());
	},
};

aroundEach(async (runTest) => {
	await DataStore.operations.run(testDataStoreProps, async () => {
		await runTest();
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
