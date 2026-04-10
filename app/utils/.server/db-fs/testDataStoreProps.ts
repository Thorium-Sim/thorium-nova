import type { DatabaseContext } from "@thorium/typeguards/isDatabaseContext";
import type { DataStoreOperations } from "@thorium/utils/.server/db-fs";

export const testDataStoreProps: DataStoreOperations = {
	database: {} as DatabaseContext,
	async getData() {
		return "";
	},
	async getAssetUrl() {
		return "";
	},
	async readAsset() {
		return "";
	},
	async remove() {},
	async removeAsset() {},
	async uploadAsset(asset, fileName) {
		return "";
	},
	async write(force) {},
	async loadAllAspects(aspectClasses) {},
	async rename(newName, otherNames) {},
	async getFlights() {
		return [];
	},
	async getFlightSnapshots(flightName) {
		return [];
	},
};
