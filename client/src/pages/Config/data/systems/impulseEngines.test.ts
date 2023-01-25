import ImpulseEnginesPlugin from "@server/classes/Plugins/ShipSystems/ImpulseEngines";
import {
  createMockDataContext,
  createMockRouter,
} from "@server/utils/createMockDataContext";

describe("impulse engines plugin input", () => {
  it("should create a new impulse engine system", async () => {
    const dataContext = createMockDataContext();
    const router = createMockRouter(dataContext);
    const created = await router.plugin.systems.create({
      pluginId: "Test Plugin",
      type: "impulseEngines",
      name: "Test Impulse Engine",
    });

    expect(created).toBeTruthy();
    expect(created.shipSystemId).toEqual("Test Impulse Engine");
    const system = dataContext.server.plugins[0].aspects.shipSystems[0];
    if (!(system instanceof ImpulseEnginesPlugin))
      throw new Error("Not impulse engines");
    expect(system.type).toEqual("impulseEngines");
    expect(system.cruisingSpeed).toEqual(1500);
  });
  it("should update an impulse engine system", async () => {
    const dataContext = createMockDataContext();
    const router = createMockRouter(dataContext);
    const created = await router.plugin.systems.create({
      pluginId: "Test Plugin",
      type: "impulseEngines",
      name: "Test Impulse Engine",
    });
    const system = dataContext.server.plugins[0].aspects.shipSystems[0];

    await router.plugin.systems.impulse.update({
      pluginId: "Test Plugin",
      systemId: "Test Impulse Engine",
      cruisingSpeed: 2000,
    });
    if (!(system instanceof ImpulseEnginesPlugin))
      throw new Error("Not impulse engines");
    expect(system.cruisingSpeed).toEqual(2000);

    expect(system.emergencySpeed).toEqual(2000);
    await router.plugin.systems.impulse.update({
      pluginId: "Test Plugin",
      systemId: "Test Impulse Engine",
      emergencySpeed: 1000,
    });
    expect(system.emergencySpeed).toEqual(1000);

    expect(system.thrust).toEqual(12500);
    await router.plugin.systems.impulse.update({
      pluginId: "Test Plugin",
      systemId: "Test Impulse Engine",
      thrust: 10000,
    });
    expect(system.thrust).toEqual(10000);
  });
});
