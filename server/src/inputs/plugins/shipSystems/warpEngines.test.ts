import WarpEnginesPlugin from "@server/classes/Plugins/ShipSystems/warpEngines";
import {
  createMockDataContext,
  createMockRouter,
} from "@server/utils/createMockDataContext";

const testConfig = {
  systemName: "warp engines",
  systemType: "warpEngines",
  systemClass: WarpEnginesPlugin,
} as const;
describe(`${testConfig.systemName} plugin input`, () => {
  it(`should create a new ${testConfig.systemName} system`, async () => {
    const dataContext = createMockDataContext();
    const router = createMockRouter(dataContext);
    const created = await router.plugin.systems.create({
      pluginId: "Test Plugin",
      type: testConfig.systemType,
      name: `Test ${testConfig.systemName}`,
    });

    expect(created).toBeTruthy();
    expect(created.shipSystemId).toEqual(`Test ${testConfig.systemName}`);
    const system = dataContext.server.plugins[0].aspects.shipSystems[0];
    if (!(system instanceof testConfig.systemClass))
      throw new Error(`Not ${testConfig.systemName}`);
    expect(system.type).toEqual(testConfig.systemType);

    // Test the default properties of the system
    expect(system.interstellarCruisingSpeed).toEqual(599_600_000_000);
  });
  it(`should update an ${testConfig.systemName} system`, async () => {
    const dataContext = createMockDataContext();
    const router = createMockRouter(dataContext);

    const created = await router.plugin.systems.create({
      pluginId: "Test Plugin",
      type: testConfig.systemType,
      name: `Test ${testConfig.systemName}`,
    });
    const system = dataContext.server.plugins[0].aspects.shipSystems[0];
    if (!(system instanceof testConfig.systemClass))
      throw new Error(`Not ${testConfig.systemName}`);

    // Test updating the system
    await router.plugin.systems.warp.update({
      pluginId: "Test Plugin",
      systemId: `Test ${testConfig.systemName}`,
      interstellarCruisingSpeed: 1_000_000_000,
    });
    expect(system.interstellarCruisingSpeed).toEqual(1_000_000_000);

    expect(system.solarCruisingSpeed).toEqual(29_980_000);
    await router.plugin.systems.warp.update({
      pluginId: "Test Plugin",
      systemId: `Test ${testConfig.systemName}`,
      solarCruisingSpeed: 1_000_000_000,
    });
    expect(system.solarCruisingSpeed).toEqual(1_000_000_000);

    expect(system.warpFactorCount).toEqual(5);
    await expect(
      router.plugin.systems.warp.update({
        pluginId: "Test Plugin",
        systemId: `Test ${testConfig.systemName}`,
        warpFactorCount: 0.5,
      })
    ).rejects.toThrow();
    await expect(
      router.plugin.systems.warp.update({
        pluginId: "Test Plugin",
        systemId: `Test ${testConfig.systemName}`,
        warpFactorCount: 3.5,
      })
    ).rejects.toThrow();
    await router.plugin.systems.warp.update({
      pluginId: "Test Plugin",
      systemId: `Test ${testConfig.systemName}`,
      warpFactorCount: 3,
    });
    expect(system.warpFactorCount).toEqual(3);
  });
});
