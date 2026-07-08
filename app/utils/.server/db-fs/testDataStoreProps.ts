import type { DatabaseContext } from "@thorium/typeguards/isDatabaseContext";
import type { ThoriumContext } from "@thorium/utils/.server/context";

export const testDataStoreProps: ThoriumContext = {
	database: {} as DatabaseContext,
	thoriumPath: "",
	async getData() {
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
