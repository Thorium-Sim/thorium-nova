import PlanetPlugin from "../classes/Plugins/Universe/Planet";
import SolarSystemPlugin from "../classes/Plugins/Universe/SolarSystem";
import StarPlugin from "../classes/Plugins/Universe/Star";
import {Entity} from "../utils/ecs";

export function spawnSolarSystem(systemPlugin: SolarSystemPlugin) {
  const system = new Entity();
  system.addComponent("identity", {
    name: systemPlugin.name,
    description: systemPlugin.description,
  });
  system.addComponent("tags", {tags: systemPlugin.tags});
  system.addComponent("isSolarSystem", {...systemPlugin});
  system.addComponent("position", systemPlugin.position);

  // Spawn all the stars and planets
  const stars = systemPlugin.stars.map(star => {
    return {
      pluginId: systemPlugin.pluginName,
      pluginSystemId: systemPlugin.name,
      objectId: star.name,
      type: "star" as const,
      entity: spawnStar(star, system.id),
    };
  });
  const planets = systemPlugin.planets.map(planet => {
    return {
      pluginId: systemPlugin.pluginName,
      pluginSystemId: systemPlugin.name,
      objectId: planet.name,
      type: "planet" as const,
      entity: spawnPlanet(planet, system.id),
    };
  });

  return [
    {
      pluginSystemId: systemPlugin.name,
      pluginId: systemPlugin.pluginName,
      type: "system" as const,
      entity: system,
    },
    ...stars,
    ...planets,
  ];
}

function spawnStar(star: StarPlugin, systemId: number) {
  const starEntity = new Entity();
  starEntity.addComponent("identity", {
    name: star.name,
    description: star.description,
  });
  starEntity.addComponent("tags", {tags: star.tags});
  starEntity.addComponent("isStar", {...star});
  starEntity.addComponent("satellite", {...star.satellite, parentId: systemId});
  starEntity.addComponent("temperature", {temperature: star.temperature});

  return starEntity;
}

function spawnPlanet(planet: PlanetPlugin, systemId: number) {
  const planetEntity = new Entity();
  planetEntity.addComponent("identity", {
    name: planet.name,
    description: planet.description,
  });
  planetEntity.addComponent("tags", {tags: planet.tags});
  planetEntity.addComponent("isPlanet", {...planet.isPlanet});
  planetEntity.addComponent("satellite", {
    ...planet.satellite,
    parentId: systemId,
  });

  planetEntity.addComponent("temperature", {temperature: planet.temperature});
  planetEntity.addComponent("population", {count: planet.population});

  return planetEntity;
}
