import ThrustersPlugin from "server/src/classes/Plugins/ShipSystems/Thrusters";
import {
	createMockDataContext,
	createMockRouter,
} from "server/src/utils/createMockDataContext";

describe("thrusters plugin input", () => {
	it("should create a new thrusters system", async () => {
		const dataContext = createMockDataContext();
		const router = createMockRouter(dataContext);
		const created = await router.plugin.systems.create({
			pluginId: "Test Plugin",
			type: "thrusters",
			name: "Test Thrusters",
		});

		expect(created).toBeTruthy();
		expect(created.shipSystemId).toEqual("Test Thrusters");
		const system = dataContext.server.plugins[0].aspects.shipSystems[0];
		if (!(system instanceof ThrustersPlugin)) throw new Error("Not thrusters");
		expect(system.type).toEqual("thrusters");
		expect(system.directionMaxSpeed).toEqual(1);
	});
	it("should update a thrusters system", async () => {
		const dataContext = createMockDataContext();
		const router = createMockRouter(dataContext);
		const created = await router.plugin.systems.create({
			pluginId: "Test Plugin",
			type: "thrusters",
			name: "Test Thrusters",
		});
		const system = dataContext.server.plugins[0].aspects.shipSystems[0];
		await router.plugin.systems.thrusters.update({
			pluginId: "Test Plugin",
			systemId: "Test Thrusters",
			directionMaxSpeed: 5,
		});
		if (!(system instanceof ThrustersPlugin)) throw new Error("Not thrusters");
		expect(system.directionMaxSpeed).toEqual(5);

		expect(system.rotationMaxSpeed).toEqual(5);
		await router.plugin.systems.thrusters.update({
			pluginId: "Test Plugin",
			systemId: "Test Thrusters",
			rotationMaxSpeed: 2,
		});
		expect(system.rotationMaxSpeed).toEqual(2);
	});
});
