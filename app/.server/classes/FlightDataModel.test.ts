import {
	createMockRouter,
	MockDataContext,
} from "@thorium/utils/.server/createMockDataContext";
import {
	DataStore,
	type DataStoreOperations,
} from "@thorium/utils/.server/db-fs";
import { expect, test } from "vitest";
import { database } from "@thorium/.server/init/buildDatabase";
import { Entity } from "@thorium/utils/ecs";
import { dump } from "js-yaml";

const fileMap = new Map<string, string>();
const testDataStoreProps: DataStoreOperations = {
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
	async loadAspect() {
		return [];
	},
	async rename(newName, otherNames) {},

	async getFlights() {
		return [];
	},
	async getFlightSnapshots(flightName) {
		return Array.from(fileMap.keys());
	},
};

test("snapshot", async () => {
	await DataStore.operations.run(testDataStoreProps, async () => {
		const dataContext = new MockDataContext();

		database.server = dataContext.database.server;
		database.flight = dataContext.database.flight;
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
});
