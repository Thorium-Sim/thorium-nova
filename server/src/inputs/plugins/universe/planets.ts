import PlanetPlugin from "server/src/classes/Plugins/Universe/Planet";
import {
  AtmosphericComposition,
  planetTypes,
  PlanetTypes,
  Zone,
} from "server/src/spawners/planetTypes";
import {DataContext} from "server/src/utils/DataContext";
import {pubsub} from "server/src/utils/pubsub";
import {randomFromList} from "server/src/utils/randomFromList";
import {randomFromRange} from "server/src/utils/randomFromRange";
import {
  Kelvin,
  Kilometer,
  SolarRadius,
  solarRadiusToKilometers,
  TerranMass,
} from "server/src/utils/unitTypes";
import {getPlugin} from "../utils";
import {toRoman} from "roman-numerals";
import {generateIncrementedName} from "server/src/utils/generateIncrementedName";
import getHabitableZone from "server/src/utils/getHabitableZone";
import path from "path";
import {promises as fs} from "fs";
import {thoriumPath} from "server/src/utils/appPaths";
import {SatelliteComponent} from "server/src/components/satellite";

function getSystem(context: DataContext, pluginId: string, systemId: string) {
  const plugin = getPlugin(context, pluginId);
  const system = plugin.aspects.solarSystems.find(
    system => system.name === systemId
  );
  if (!system) {
    throw new Error(`No system found with id ${systemId}`);
  }
  return system;
}

// Just less than the orbit of Neptune 🥶
const MAX_PLANET_DISTANCE: Kilometer = 4_000_000_000;

// 1/5 the orbit of Mercury 🥵
const MIN_PLANET_DISTANCE: Kilometer = 10_000_000;

function getSemiMajorAxis(
  inputZone: Zone,
  stars: {radius: SolarRadius; temperature: Kelvin}[]
) {
  const biggestStar = stars.reduce(
    (
      prev: {radius: SolarRadius; temperature: Kelvin} | null,
      star: {radius: SolarRadius; temperature: Kelvin}
    ) => {
      if (prev === null) return star;
      if (prev.radius > star.radius) return prev;
      return star;
    },
    null
  );

  let habitableZone = {min: MIN_PLANET_DISTANCE, max: MAX_PLANET_DISTANCE};
  if (biggestStar && biggestStar.temperature) {
    const tempZone = getHabitableZone(
      biggestStar.radius,
      biggestStar.temperature
    );
    habitableZone = {
      min: Math.max(tempZone.min, MIN_PLANET_DISTANCE),
      max: Math.min(tempZone.max, MAX_PLANET_DISTANCE),
    };
  }
  let distance = 0;
  const zone = randomFromList(inputZone);
  if (zone === "hot") {
    distance = Math.round(
      randomFromRange({min: MIN_PLANET_DISTANCE, max: habitableZone.min})
    );
  }
  if (zone === "habitable") {
    distance = Math.round(randomFromRange(habitableZone));
  }
  if (zone === "cold") {
    distance = Math.round(
      randomFromRange({min: habitableZone.max, max: MAX_PLANET_DISTANCE})
    );
  }

  return distance;
}
export const planetPluginInputs = {
  pluginPlanetCreate(
    context: DataContext,
    params: {
      pluginId: string;
      solarSystemId: string;
      planetType: PlanetTypes;
    }
  ) {
    const system = getSystem(context, params.pluginId, params.solarSystemId);
    const childrenPlanets = system.planets;

    const planetType = planetTypes.find(
      p => p.classification === params.planetType
    );
    if (!planetType) {
      throw new Error(`Invalid planet type: ${params.planetType}`);
    }
    const name = generateIncrementedName(
      `${system.name} ${toRoman(childrenPlanets.length + 1)}`,
      childrenPlanets.map(p => p.name)
    );

    const radius = randomFromRange(planetType.radiusRange);

    let orbitalArc = Math.random() * 360;
    const semiMajorAxis = getSemiMajorAxis(planetType.zone, system.stars);

    const planet = new PlanetPlugin({
      name,
      isPlanet: {
        age: randomFromRange(planetType.ageRange),
        classification: planetType.classification,
        radius: radius,
        terranMass: randomFromRange(planetType.terranMassRange),
        isHabitable: planetType.habitable,
        lifeforms: planetType.lifeforms,
        atmosphericComposition: planetType.atmosphericComposition,
        textureMapAsset: randomFromList(planetType.possibleTextureMaps),
        cloudMapAsset:
          planetType.hasClouds <= Math.random()
            ? randomFromList(planetType.possibleCloudMaps)
            : null,
        ringMapAsset:
          planetType.hasRings <= Math.random()
            ? randomFromList(planetType.possibleRingMaps)
            : null,
      },
      satellite: {
        orbitalArc,
        semiMajorAxis,
        showOrbit: true,
        parentId: system.name,
      },
      population:
        typeof planetType.population === "number"
          ? planetType.population
          : randomFromRange(planetType.population),
      temperature: randomFromRange(planetType.temperatureRange),
    });
    system.planets.push(planet);

    pubsub.publish("pluginSolarSystems", {
      pluginId: params.pluginId,
    });
    pubsub.publish("pluginSolarSystem", {
      pluginId: params.pluginId,
      solarSystemId: system.name,
    });

    return planet;
  },
  pluginPlanetDelete(
    context: DataContext,
    params: {
      pluginId: string;
      solarSystemId: string;
      planetId: string;
    }
  ) {
    const system = getSystem(context, params.pluginId, params.solarSystemId);
    const planet = system.planets.find(s => s.name === params.planetId);
    if (!system) {
      throw new Error(`No planet found with id ${params.planetId}`);
    }
    system.planets = system.planets.filter(s => s.name !== params.planetId);

    pubsub.publish("pluginSolarSystems", {
      pluginId: params.pluginId,
    });
    pubsub.publish("pluginSolarSystem", {
      pluginId: params.pluginId,
      solarSystemId: system.name,
    });
    return planet;
  },
  async pluginPlanetUpdate(
    context: DataContext,
    params: {
      pluginId: string;
      solarSystemId: string;
      planetId: string;
      name?: string;
      age?: number;
      classification?: PlanetTypes;
      radius?: Kilometer;
      terranMass?: TerranMass;
      isHabitable?: boolean;
      lifeforms?: string[];
      atmosphericComposition?: AtmosphericComposition;
      textureMapAsset?: File | string;
      cloudMapAsset?: File | string | null;
      ringMapAsset?: File | string | null;
      population?: number;
      temperature?: Kelvin;
      satellite?: Partial<SatelliteComponent>;
    }
  ) {
    const system = getSystem(context, params.pluginId, params.solarSystemId);
    const planet = system.planets.find(s => s.name === params.planetId);
    if (!planet) {
      throw new Error(`No planet found with id ${params.planetId}`);
    }
    if (params.name) {
      planet.name = generateIncrementedName(
        `${params.name} ${toRoman(system.planets.length + 1)}`,
        system.planets.map(p => p.name)
      );
    }
    if (typeof params.age === "number") {
      planet.isPlanet.age = params.age;
    }
    // We'll allow updating the planet classification - it's really only useful for the default values
    if (params.classification) {
      planet.isPlanet.classification = params.classification;
    }
    if (params.radius) {
      planet.isPlanet.radius = params.radius;
    }
    if (typeof params.terranMass === "number") {
      planet.isPlanet.terranMass = params.terranMass;
    }
    if (typeof params.isHabitable === "boolean") {
      planet.isPlanet.isHabitable = params.isHabitable;
    }
    if (typeof params.lifeforms === "number") {
      planet.isPlanet.lifeforms = params.lifeforms;
    }
    if (params.satellite) {
      planet.satellite = {
        ...planet.satellite,
        ...params.satellite,
      };
    }
    if (params.atmosphericComposition) {
      planet.isPlanet.atmosphericComposition = params.atmosphericComposition;
    }

    // TODO March 18 2022 - Make these support file uploads.
    if (typeof params.textureMapAsset === "string") {
      const ext = path.extname(params.textureMapAsset);
      await moveFile(
        params.textureMapAsset,
        `texture-${planet.name}${ext}`,
        "textureMapAsset"
      );
    }
    if (typeof params.cloudMapAsset === "string") {
      const ext = path.extname(params.cloudMapAsset);
      await moveFile(
        params.cloudMapAsset,
        `cloud-${planet.name}${ext}`,
        "cloudMapAsset"
      );
    }
    if (typeof params.ringMapAsset === "string") {
      const ext = path.extname(params.ringMapAsset);
      await moveFile(
        params.ringMapAsset,
        `ring-${planet.name}${ext}`,
        "ringMapAsset"
      );
    }
    if (params.cloudMapAsset === null) {
      planet.isPlanet.cloudMapAsset = null;
    }
    if (params.ringMapAsset === null) {
      planet.isPlanet.ringMapAsset = null;
    }

    if (typeof params.population === "number") {
      planet.population = params.population;
    }
    if (typeof params.temperature === "number") {
      planet.temperature = params.temperature;
    }

    pubsub.publish("pluginSolarSystems", {
      pluginId: params.pluginId,
    });
    pubsub.publish("pluginSolarSystem", {
      pluginId: params.pluginId,
      solarSystemId: system.name,
    });

    async function moveFile(
      file: Blob | File | string,
      filePath: string,
      propertyName: "textureMapAsset" | "cloudMapAsset" | "ringMapAsset"
    ) {
      if (!system || !planet) return;
      if (typeof file === "string") {
        await fs.mkdir(path.join(thoriumPath, system.assetPath), {
          recursive: true,
        });
        await fs.rename(
          file,
          path.join(thoriumPath, system.assetPath, filePath)
        );
        planet.isPlanet[propertyName] = path.join(system.assetPath, filePath);
      }
    }

    return planet;
  },
};
