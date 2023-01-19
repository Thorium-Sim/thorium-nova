import {promises as fs} from "fs";
import {
  createMockDataContext,
  createMockRouter,
} from "@server/utils/createMockDataContext";

describe("solar system plugin input", () => {
  it("should create a new solar system", async () => {
    const mockDataContext = createMockDataContext();
    const router = createMockRouter(mockDataContext);

    const solarSystem = await router.plugin.starmap.solarSystem.create({
      pluginId: "Test Plugin",
      position: {
        x: 100,
        y: 200,
        z: 300,
      },
    });
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
    const router = createMockRouter(mockDataContext);

    const solarSystem = await router.plugin.starmap.solarSystem.create({
      pluginId: "Test Plugin",
      position: {
        x: 100,
        y: 200,
        z: 300,
      },
    });
    const solarSystem2 =
      mockDataContext.server.plugins[0].aspects.solarSystems[0];
    expect(solarSystem2.position).toEqual({x: 100, y: 200, z: 300});

    await router.plugin.starmap.solarSystem.update({
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
    const router = createMockRouter(mockDataContext);

    const solarSystem = await router.plugin.starmap.solarSystem.create({
      pluginId: "Test Plugin",
      position: {
        x: 100,
        y: 200,
        z: 300,
      },
    });
    expect(mockDataContext.server.plugins[0].aspects.solarSystems.length).toBe(
      1
    );
    await router.plugin.starmap.solarSystem.delete({
      pluginId: "Test Plugin",
      solarSystemId: solarSystem.solarSystemId,
    });
    expect(mockDataContext.server.plugins[0].aspects.solarSystems.length).toBe(
      0
    );
  });
  afterAll(async () => {
    try {
      await fs.rm("plugins", {recursive: true});
    } catch {}
  });
});
