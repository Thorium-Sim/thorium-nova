import {
  createMockDataContext,
  createMockRouter,
} from "server/src/utils/createMockDataContext";

describe("solar system planet plugin input", () => {
  it("should create a new planet in a solar system", async () => {
    const oldRandom = Math.random;
    Math.random = () => 0.5;
    const context = createMockDataContext();
    const router = createMockRouter(context);
    context.server.plugins[0].aspects.solarSystems.push({
      name: "Test System",
      stars: [{radius: 1, temperature: 5772}],
      planets: [],
    } as any);
    const planet = await router.plugin.starmap.planet.create({
      pluginId: "Test Plugin",
      solarSystemId: "Test System",
      planetType: "A",
    });

    // All of these should just work based on the random number being overridden
    expect(planet).toMatchInlineSnapshot(`
      PlanetPlugin {
        "description": "",
        "isPlanet": Object {
          "age": 1000500000,
          "atmosphericComposition": Array [],
          "classification": "A",
          "cloudMapAsset": null,
          "isHabitable": true,
          "lifeforms": Array [
            "None",
          ],
          "radius": 2750,
          "ringMapAsset": "/plugins/Thorium Default/assets/default/rings/ring_texturesDust.png",
          "terranMass": 0.65,
          "textureMapAsset": "/plugins/Thorium Default/assets/default/planets/planet_textureAcid.jpg",
        },
        "name": "Test System I",
        "population": 0,
        "satellite": Object {
          "axialTilt": 0,
          "eccentricity": 0,
          "inclination": 0,
          "orbitalArc": 180,
          "parentId": "Test System",
          "semiMajorAxis": 2112004271,
          "showOrbit": true,
        },
        "tags": Array [],
        "temperature": 1583,
      }
    `);

    const planet2 = await router.plugin.starmap.planet.create({
      pluginId: "Test Plugin",
      solarSystemId: "Test System",
      planetType: "M",
    });
    expect(planet2).toMatchInlineSnapshot(`
      PlanetPlugin {
        "description": "",
        "isPlanet": Object {
          "age": 6500000000,
          "atmosphericComposition": Array [],
          "classification": "M",
          "cloudMapAsset": null,
          "isHabitable": true,
          "lifeforms": Array [
            "Varied and extensive vegetation and animal life, humanoids",
          ],
          "radius": 6250,
          "ringMapAsset": "/plugins/Thorium Default/assets/default/rings/ring_texturesDust.png",
          "terranMass": 1,
          "textureMapAsset": "/plugins/Thorium Default/assets/default/planets/Terrestrial3.jpg",
        },
        "name": "Test System II",
        "population": 5005000000,
        "satellite": Object {
          "axialTilt": 0,
          "eccentricity": 0,
          "inclination": 0,
          "orbitalArc": 180,
          "parentId": "Test System",
          "semiMajorAxis": 164272931,
          "showOrbit": true,
        },
        "tags": Array [],
        "temperature": 295.5,
      }
    `);
    Math.random = oldRandom;
  });

  it("should delete a planet in the solar system", async () => {
    const context = createMockDataContext();
    const router = createMockRouter(context);
    context.server.plugins[0].aspects.solarSystems.push({
      name: "Test System",
      stars: [{radius: 1, temperature: 5772}],
      planets: [],
    } as any);

    const planet = await router.plugin.starmap.planet.create({
      pluginId: "Test Plugin",
      solarSystemId: "Test System",
      planetType: "C",
    });
    const planet2 = await router.plugin.starmap.planet.create({
      pluginId: "Test Plugin",
      solarSystemId: "Test System",
      planetType: "O",
    });

    expect(
      context.server.plugins[0].aspects.solarSystems[0].planets.length
    ).toBe(2);
    expect(
      context.server.plugins[0].aspects.solarSystems[0].planets[0].name
    ).toBe("Test System I");
    expect(
      context.server.plugins[0].aspects.solarSystems[0].planets[1].name
    ).toBe("Test System II");
    await router.plugin.starmap.planet.delete({
      pluginId: "Test Plugin",
      solarSystemId: "Test System",
      planetId: planet.name,
    });

    expect(
      context.server.plugins[0].aspects.solarSystems[0].planets.length
    ).toBe(1);
    expect(
      context.server.plugins[0].aspects.solarSystems[0].planets[0].name
    ).toBe("Test System II");
  });
  it("should update properties of a planet", async () => {
    const oldRandom = Math.random;
    Math.random = () => 0.5;
    const context = createMockDataContext();
    const router = createMockRouter(context);
    context.server.plugins[0].aspects.solarSystems.push({
      name: "Test System",
      stars: [{radius: 1, temperature: 5772}],
      planets: [],
    } as any);

    const planet = await router.plugin.starmap.planet.create({
      pluginId: "Test Plugin",
      solarSystemId: "Test System",
      planetType: "C",
    });
    expect(planet).toMatchInlineSnapshot(`
      PlanetPlugin {
        "description": "",
        "isPlanet": Object {
          "age": 510000000,
          "atmosphericComposition": Array [],
          "classification": "C",
          "cloudMapAsset": null,
          "isHabitable": true,
          "lifeforms": Array [
            "None",
          ],
          "radius": 2750,
          "ringMapAsset": "/plugins/Thorium Default/assets/default/rings/ring_texturesDust.png",
          "terranMass": 0.55,
          "textureMapAsset": "/plugins/Thorium Default/assets/default/planets/planet_textureAzure.jpg",
        },
        "name": "Test System I",
        "population": 0,
        "satellite": Object {
          "axialTilt": 0,
          "eccentricity": 0,
          "inclination": 0,
          "orbitalArc": 180,
          "parentId": "Test System",
          "semiMajorAxis": 2112004271,
          "showOrbit": true,
        },
        "tags": Array [],
        "temperature": 44,
      }
    `);

    await router.plugin.starmap.planet.update({
      pluginId: "Test Plugin",
      solarSystemId: "Test System",
      planetId: planet.name,
      age: 50,
      population: 5000,
      radius: 1000,
      temperature: 100,
      isHabitable: false,
      lifeforms: ["Test Lifeforms"],
      terranMass: 0.5,
      satellite: {
        semiMajorAxis: 500000,
        orbitalArc: 201,
      },
    });

    expect(planet).toMatchInlineSnapshot(`
      PlanetPlugin {
        "description": "",
        "isPlanet": Object {
          "age": 50,
          "atmosphericComposition": Array [],
          "classification": "C",
          "cloudMapAsset": null,
          "isHabitable": false,
          "lifeforms": Array [
            "None",
          ],
          "radius": 1000,
          "ringMapAsset": "/plugins/Thorium Default/assets/default/rings/ring_texturesDust.png",
          "terranMass": 0.5,
          "textureMapAsset": "/plugins/Thorium Default/assets/default/planets/planet_textureAzure.jpg",
        },
        "name": "Test System I",
        "population": 5000,
        "satellite": Object {
          "axialTilt": 0,
          "eccentricity": 0,
          "inclination": 0,
          "orbitalArc": 201,
          "parentId": "Test System",
          "semiMajorAxis": 500000,
          "showOrbit": true,
        },
        "tags": Array [],
        "temperature": 100,
      }
    `);

    Math.random = oldRandom;
  });
});
