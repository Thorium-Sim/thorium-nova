import InertialDampenersPlugin from "server/src/classes/Plugins/ShipSystems/InertialDampeners";
import {
	createMockDataContext,
	createMockRouter,
} from "server/src/utils/createMockDataContext";

describe("inertial dampeners plugin input", () => {
	it("should create a new impulse engine system", async () => {
		const dataContext = createMockDataContext();
		const router = createMockRouter(dataContext);
		const created = await router.plugin.systems.create({
			pluginId: "Test Plugin",
			type: "inertialDampeners",
			name: "Test Inertial Dampeners",
		});

		expect(created).toBeTruthy();
		expect(created.shipSystemId).toEqual("Test Inertial Dampeners");
		const system = dataContext.server.plugins[0].aspects.shipSystems[0];
		if (!(system instanceof InertialDampenersPlugin))
			throw new Error("Not inertial dampeners");
		expect(system.type).toEqual("inertialDampeners");
		expect(system.dampening).toEqual(1);
	});
	it("should update an impulse engine system", async () => {
		const dataContext = createMockDataContext();
		const router = createMockRouter(dataContext);
		const created = await router.plugin.systems.create({
			pluginId: "Test Plugin",
			type: "inertialDampeners",
			name: "Test Inertial Dampeners",
		});
		const system = dataContext.server.plugins[0].aspects.shipSystems[0];

		if (!(system instanceof InertialDampenersPlugin))
			throw new Error("Not inertial dampeners");
		expect(system.dampening).toEqual(1);
		await router.plugin.systems.inertialDampeners.update({
			pluginId: "Test Plugin",
			systemId: "Test Inertial Dampeners",
			dampening: 2000,
		});

		expect(system.dampening).toEqual(2000);
	});
});
