import {starPluginInputs} from "../plugins/universe/stars";
function createMockDataContext() {
  const context = {
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
            solarSystems: [
              {
                name: "Test System",
                stars: [],
              },
            ],
          },
        },
      ],
    },
  } as any;

  return context;
}

describe("solar system star plugin input", () => {
  it("should create a new star in the solar system", async () => {
    const mockDataContext = createMockDataContext();

    const system = mockDataContext.server.plugins[0].aspects.solarSystems[0];
    const star = starPluginInputs.pluginStarCreate(mockDataContext, {
      pluginId: "Test Plugin",
      solarSystemId: system.name,
      spectralType: "G",
    });

    expect(system.stars.length).toBe(1);
    expect(system.stars[0].spectralType).toBe("G");

    expect(star.name).toBe("Test System A");
    expect(star.spectralType).toBe("G");
  });
  it("should adjust the orbital positions when there are two stars in the system", async () => {
    const mockDataContext = createMockDataContext();

    const system = mockDataContext.server.plugins[0].aspects.solarSystems[0];
    const star = starPluginInputs.pluginStarCreate(mockDataContext, {
      pluginId: "Test Plugin",
      solarSystemId: system.name,
      spectralType: "G",
    });

    const {orbitalArc, semiMajorAxis} = star.satellite;
    const star2 = starPluginInputs.pluginStarCreate(mockDataContext, {
      pluginId: "Test Plugin",
      solarSystemId: system.name,
      spectralType: "O",
    });

    expect(system.stars.length).toBe(2);
    expect(orbitalArc).toBe(star.satellite.orbitalArc);
    expect(Math.round(star2.satellite.orbitalArc - orbitalArc)).toBe(180);

    expect(star.satellite.semiMajorAxis).toEqual(star2.satellite.semiMajorAxis);
    expect(star.satellite.semiMajorAxis).toBeGreaterThan(0);
  });
  it("should delete a system that has been created", () => {
    const mockDataContext = createMockDataContext();

    const system = mockDataContext.server.plugins[0].aspects.solarSystems[0];
    const star = starPluginInputs.pluginStarCreate(mockDataContext, {
      pluginId: "Test Plugin",
      solarSystemId: system.name,
      spectralType: "G",
    });

    expect(system.stars.length).toBe(1);

    starPluginInputs.pluginStarDelete(mockDataContext, {
      pluginId: "Test Plugin",
      solarSystemId: system.name,
      starId: star.name,
    });

    expect(system.stars.length).toBe(0);
  });
  it("should update properties of a star", () => {
    const mockDataContext = createMockDataContext();

    const system = mockDataContext.server.plugins[0].aspects.solarSystems[0];
    const star = starPluginInputs.pluginStarCreate(mockDataContext, {
      pluginId: "Test Plugin",
      solarSystemId: system.name,
      spectralType: "G",
    });

    expect(system.stars.length).toBe(1);
    expect(star.spectralType).toBe("G");

    starPluginInputs.pluginStarUpdate(mockDataContext, {
      pluginId: "Test Plugin",
      solarSystemId: system.name,
      starId: star.name,
      temperature: 100,
      age: 50,
      name: "Test Star",
      solarMass: 20,
    });

    expect(system.stars.length).toBe(1);
    expect(star.temperature).toBe(100);
    expect(star.age).toBe(50);
    expect(star.name).toBe("Test Star");
    expect(star.solarMass).toBe(20);
  });
});
