import {
  createMockDataContext,
  createMockRouter,
} from "@server/utils/createMockDataContext";

describe("flight input", () => {
  it("should start a flight", async () => {
    const mockDataContext = createMockDataContext();
    mockDataContext.database.flight = null;
    const router = createMockRouter(mockDataContext);

    expect(mockDataContext.flight).toBeNull();

    const flight = await router.flight.start({
      flightName: "Test Flight",
      ships: [
        {
          shipName: "Test Ship",
          shipTemplate: {pluginId: "Test Plugin", shipId: "Test Template"},
          crewCount: 1,
        },
      ],
    });
    expect(mockDataContext.flight).toBeDefined();
    if (!mockDataContext.flight) throw new Error("No flight created");
    expect(mockDataContext.flight.name).toEqual("Test Flight");
    expect(mockDataContext.flight.ships.length).toEqual(1);
    expect(mockDataContext.flight.ships[0].components.identity?.name).toEqual(
      "Test Ship"
    );
  });
  it("should correctly spawn star map objects", async () => {
    const mockDataContext = createMockDataContext();
    const router = createMockRouter(mockDataContext);
    mockDataContext.database.flight = null;

    // Create some star map object plugins
    const solarSystem = await router.plugin.starmap.solarSystem.create({
      pluginId: "Test Plugin",
      position: {x: 1, y: 2, z: 3},
    });

    const star = await router.plugin.starmap.star.create({
      pluginId: "Test Plugin",
      solarSystemId: solarSystem.solarSystemId,
      spectralType: "G",
    });
    const planet = await router.plugin.starmap.planet.create({
      pluginId: "Test Plugin",
      solarSystemId: solarSystem.solarSystemId,
      planetType: "M",
    });

    // Start a flight
    const flight = await router.flight.start({
      flightName: "Test Flight",
      ships: [
        {
          shipName: "Test Ship",
          shipTemplate: {pluginId: "Test Plugin", shipId: "Test Template"},
          crewCount: 1,
        },
      ],
    });
    expect(mockDataContext.flight).toBeDefined();
    if (!mockDataContext.flight) throw new Error("No flight created");

    // Check that the flight has the correct number of objects
    const systemEntity = mockDataContext.flight.ecs.entities.find(
      entity => entity.components.isSolarSystem
    );
    expect(systemEntity).toBeDefined();
    expect(systemEntity?.components.identity?.name).toEqual(
      solarSystem.solarSystemId
    );
    const {x, y, z} = systemEntity?.components.position || {};
    expect({x, y, z}).toMatchInlineSnapshot(`
      Object {
        "x": 1,
        "y": 2,
        "z": 3,
      }
    `);
    const starEntity = mockDataContext.flight.ecs.entities.find(
      entity => entity.components.isStar
    );
    expect(starEntity).toBeDefined();
    expect(starEntity?.components.identity?.name).toEqual(star.name);
    const planetEntity = mockDataContext.flight.ecs.entities.find(
      entity => entity.components.isPlanet
    );
    expect(planetEntity).toBeDefined();
    expect(planetEntity?.components.identity?.name).toEqual(planet.name);
  });
  it("should properly position the player ship in sandbox mode", async () => {
    const mockDataContext = createMockDataContext();
    const router = createMockRouter(mockDataContext);

    mockDataContext.database.flight = null;
    // Shim Math.random
    const oldRandom = Math.random;
    Math.random = () => 0.5;
    // Create some star map object plugins
    const solarSystem = await router.plugin.starmap.solarSystem.create({
      pluginId: "Test Plugin",
      position: {x: 1, y: 2, z: 3},
    });
    const star = await router.plugin.starmap.star.create({
      pluginId: "Test Plugin",
      solarSystemId: solarSystem.solarSystemId,
      spectralType: "G",
    });
    const planet = await router.plugin.starmap.planet.create({
      pluginId: "Test Plugin",
      solarSystemId: solarSystem.solarSystemId,
      planetType: "M",
    });

    expect(planet.satellite).toMatchInlineSnapshot(`
      Object {
        "axialTilt": 0,
        "eccentricity": 0,
        "inclination": 0,
        "orbitalArc": 180,
        "parentId": "Eta Giclas",
        "semiMajorAxis": 228643390,
        "showOrbit": true,
      }
    `);

    const flight = await router.flight.start({
      flightName: "Test Flight",
      ships: [
        {
          shipName: "Test Ship",
          shipTemplate: {pluginId: "Test Plugin", shipId: "Test Template"},
          crewCount: 1,
          startingPoint: {
            pluginId: "Test Plugin",
            type: "planet",
            solarSystemId: solarSystem.solarSystemId,
            objectId: planet.name,
          },
        },
      ],
    });
    Math.random = oldRandom;
    expect(mockDataContext.flight).toBeDefined();
    if (!mockDataContext.flight) throw new Error("No flight created");

    expect(flight.playerShips[0].components.position).toMatchInlineSnapshot(`
      Object {
        "parentId": 19,
        "type": "solar",
        "x": -228630890,
        "y": 0,
        "z": 12500.000000028002,
      }
    `);
  });
});
