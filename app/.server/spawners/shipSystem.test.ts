import BasePlugin from "@thorium/.server/classes/Plugins";
import CoolantTankPlugin from "@thorium/.server/classes/Plugins/ShipSystems/CoolantTank";
import { spawnShipSystem } from "@thorium/.server/spawners/shipSystem";
import { thoriumContext } from "@thorium/utils/.server/context";
import { testDataStoreProps } from "@thorium/utils/.server/db-fs/testDataStoreProps";
import { aroundEach, describe, expect, it } from "vitest";

aroundEach(async (runTest) => {
	await thoriumContext.run(testDataStoreProps, async () => {
		await runTest();
	});
});

describe("ship system spawner", () => {
	it("should spawn all the coolant systems", () => {
		const coolantPlugin = new CoolantTankPlugin({ name: "Coolant Tank" }, {
			aspects: { shipSystems: [] },
		} as unknown as BasePlugin);
		const entities = spawnShipSystem(-1, coolantPlugin, "nova", [], true);

		expect(entities.length).toEqual(3);
		expect(entities.some((e) => e.components.isShipSystem?.type === "coolantPump")).toBeTruthy();
		expect(
			entities.some((e) => e.components.isShipSystem?.type === "coolantRadiator"),
		).toBeTruthy();
		expect(entities.some((e) => e.components.isShipSystem?.type === "coolantTank")).toBeTruthy();
	});
});
