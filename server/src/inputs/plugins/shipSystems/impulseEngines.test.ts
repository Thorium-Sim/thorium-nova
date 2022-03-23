import {shipSystemsPluginInput} from ".";
import {impulseEnginesPluginInput} from "./impulseEngines";

function createMockDataContext() {
  return {
    flight: null,
    server: {
      plugins: [
        {
          id: "Test Plugin",
          name: "Test Plugin",
          active: true,
          aspects: {
            shipSystems: [],
          },
        },
      ],
    },
  } as any;
}

describe("impulse engines plugin input", () => {
  it("should create a new impulse engine system", async () => {
    const dataContext = createMockDataContext();
    const created = await shipSystemsPluginInput.pluginShipSystemCreate(
      dataContext,
      {
        pluginId: "Test Plugin",
        type: "impulseEngines",
        name: "Test Impulse Engine",
      }
    );

    expect(created).toBeTruthy();
    expect(created.shipSystemId).toEqual("Test Impulse Engine");
    const system = dataContext.server.plugins[0].aspects.shipSystems[0];
    expect(system.type).toEqual("impulseEngines");
    expect(system.cruisingSpeed).toEqual(1500);
  });
  it("should update an impulse engine system", async () => {
    const dataContext = createMockDataContext();
    const created = await shipSystemsPluginInput.pluginShipSystemCreate(
      dataContext,
      {
        pluginId: "Test Plugin",
        type: "impulseEngines",
        name: "Test Impulse Engine",
      }
    );
    const system = dataContext.server.plugins[0].aspects.shipSystems[0];

    impulseEnginesPluginInput.impulseEnginesPluginUpdate(dataContext, {
      pluginId: "Test Plugin",
      shipSystemId: "Test Impulse Engine",
      cruisingSpeed: 2000,
    });
    expect(system.cruisingSpeed).toEqual(2000);

    expect(system.emergencySpeed).toEqual(2000);
    impulseEnginesPluginInput.impulseEnginesPluginUpdate(dataContext, {
      pluginId: "Test Plugin",
      shipSystemId: "Test Impulse Engine",
      emergencySpeed: 1000,
    });
    expect(system.emergencySpeed).toEqual(1000);

    expect(system.thrust).toEqual(12500);
    impulseEnginesPluginInput.impulseEnginesPluginUpdate(dataContext, {
      pluginId: "Test Plugin",
      shipSystemId: "Test Impulse Engine",
      thrust: 10000,
    });
    expect(system.thrust).toEqual(10000);
  });
});