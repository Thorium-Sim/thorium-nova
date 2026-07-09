import { thoriumContext } from "@thorium/utils/.server/context";
import { testDataStoreProps } from "@thorium/utils/.server/db-fs/testDataStoreProps";
import { describe, expect, it } from "vitest";

import type { ServerDataModel } from "../ServerDataModel";
import Plugin from "./index";
import StationComplementPlugin from "./StationComplement";

describe("StationComplementPlugin", () => {
	it("should instantiate correctly", async () => {
		await thoriumContext.run(testDataStoreProps, async () => {
			const plugin = new Plugin(
				{},
				{
					plugins: [],
				} as unknown as ServerDataModel,
				{},
			);
			const stationComplement = await StationComplementPlugin.create({}, plugin);
			expect(stationComplement).toBeInstanceOf(StationComplementPlugin);
			expect(stationComplement.name).toBe("New Station Complement");
			expect(stationComplement.stationCount).toBe(0);
		});
	});
});
