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
	async uploadAsset() {
		return "";
	},
	async write() {},
	async loadAllAspects() {},
	async rename() {},
	async getFlights() {
		return [];
	},
	async getFlightSnapshots() {
		return [];
	},
};
