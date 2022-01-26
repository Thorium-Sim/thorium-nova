import {solarSystemsPluginInputs} from "../plugins/universe/solarSystems";
import {promises as fs} from "fs";
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
            ships: [
              {
                name: "Test Template",
              },
            ],
            solarSystems: [],
          },
        },
      ],
    },
  } as any;
}
describe("solar system plugin input", () => {
  it("should create a new solar system", async () => {
    const mockDataContext = createMockDataContext();

    const solarSystem = solarSystemsPluginInputs.pluginSolarSystemCreate(
      mockDataContext,
      {
        pluginId: "Test Plugin",
        position: {
          x: 100,
          y: 200,
          z: 300,
        },
      }
    );
    expect(solarSystem.solarSystemId).toBeDefined();
    expect(mockDataContext.server.plugins[0].aspects.solarSystems.length).toBe(
      1
    );
    const solarSystem2 =
      mockDataContext.server.plugins[0].aspects.solarSystems[0];
    expect(solarSystem2.name).toBe(solarSystem.solarSystemId);
    expect(solarSystem2.position).toEqual({x: 100, y: 200, z: 300});
  });
  it("should edit a solar system", async () => {
    const mockDataContext = createMockDataContext();
    const solarSystem = solarSystemsPluginInputs.pluginSolarSystemCreate(
      mockDataContext,
      {
        pluginId: "Test Plugin",
        position: {
          x: 100,
          y: 200,
          z: 300,
        },
      }
    );
    const solarSystem2 =
      mockDataContext.server.plugins[0].aspects.solarSystems[0];
    expect(solarSystem2.position).toEqual({x: 100, y: 200, z: 300});

    solarSystemsPluginInputs.pluginSolarSystemUpdate(mockDataContext, {
      pluginId: "Test Plugin",
      solarSystemId: solarSystem.solarSystemId,
      position: {
        x: 200,
        y: 300,
        z: 400,
      },
    });
    expect(solarSystem2.position).toEqual({x: 200, y: 300, z: 400});
  });
  it("should delete a solar system", async () => {
    const mockDataContext = createMockDataContext();
    const solarSystem = solarSystemsPluginInputs.pluginSolarSystemCreate(
      mockDataContext,
      {
        pluginId: "Test Plugin",
        position: {
          x: 100,
          y: 200,
          z: 300,
        },
      }
    );
    expect(mockDataContext.server.plugins[0].aspects.solarSystems.length).toBe(
      1
    );
    await solarSystemsPluginInputs.pluginSolarSystemDelete(mockDataContext, {
      pluginId: "Test Plugin",
      solarSystemId: solarSystem.solarSystemId,
    });
    expect(mockDataContext.server.plugins[0].aspects.solarSystems.length).toBe(
      0
    );
  });
  afterAll(async () => {
    await fs.rm("plugins", {recursive: true});
  });
});
