import { DataStore } from "@thorium/utils/.server/db-fs";
import { testDataStoreProps } from "@thorium/utils/.server/db-fs/testDataStoreProps";
import { describe, expect, it } from "vitest";

import type { ServerDataModel } from "../ServerDataModel";
import Plugin from "./index";
import StationComplementPlugin from "./StationComplement";

describe("StationComplementPlugin", () => {
	it("should instantiate correctly", async () => {
		await DataStore.operations.run(testDataStoreProps, async () => {
			const plugin = new Plugin(
				{},
				{
					plugins: [],
				} as unknown as ServerDataModel,
				{},
			);
			const stationComplement = new StationComplementPlugin({}, plugin);
			expect(stationComplement).toBeInstanceOf(StationComplementPlugin);
			expect(stationComplement.name).toBe("New Station Complement");
			expect(stationComplement.stationCount).toBe(0);
		});
	});
});
