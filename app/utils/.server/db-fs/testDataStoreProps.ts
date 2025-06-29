import type { DataStoreOperations } from "@thorium/utils/.server/db-fs";

export const testDataStoreProps: DataStoreOperations = {
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
	async loadAspect() {
		return [];
	},
	async rename(newName, otherNames) {},
	async processCSS(css) {
		return { assetUrl: "", processedCSS: "" };
	},
	async getFlights() {
		return [];
	},
};
