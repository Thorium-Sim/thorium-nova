import type PlanetPlugin from "@thorium/.server/classes/Plugins/Universe/Planet";
import type SolarSystemPlugin from "@thorium/.server/classes/Plugins/Universe/SolarSystem";
import type StarPlugin from "@thorium/.server/classes/Plugins/Universe/Star";
import { Entity } from "@thorium/utils/ecs";

export function spawnSolarSystem(
	systemPlugin: SolarSystemPlugin,
): { entity: Entity; key: string }[] {
	const system = new Entity();
	system.addComponent("identity", {
		name: systemPlugin.name,
		description: systemPlugin.description,
	});
	system.addComponent("tags", { tags: systemPlugin.tags });
	system.addComponent("isSolarSystem", { ...systemPlugin });
	system.addComponent("position", systemPlugin.position);
	if (systemPlugin.commSatellite) {
		system.addComponent("isCommSatellite", {
			radius: systemPlugin.commSatellite.radius,
		});
	}
	// Spawn all the stars and planets
	const stars = systemPlugin.stars.map((star) => {
		return {
			key: `${systemPlugin.pluginName}-${systemPlugin.name}-${star.name}`,
			entity: spawnStar(star, system.id),
		};
	});
	const planets = systemPlugin.planets.flatMap((planet) => {
		const entity = spawnPlanet(planet, system.id);
		const moons =
			planet.satellites?.map((moon) => ({
				key: `${systemPlugin.pluginName}-${systemPlugin.name}-${moon.name}`,
				entity: spawnPlanet(moon, entity.id),
			})) || [];
		return [
			{
				key: `${systemPlugin.pluginName}-${systemPlugin.name}-${planet.name}`,
				entity,
			},
			...moons,
		];
	});

	return [
		{
			key: `${systemPlugin.pluginName}-${systemPlugin.name}`,
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
	starEntity.addComponent("tags", { tags: star.tags });
	starEntity.addComponent("isStar", { ...star });
	starEntity.addComponent("satellite", {
		...star.satellite,
		parentId: systemId,
	});
	starEntity.addComponent("temperature", { temperature: star.temperature });

	return starEntity;
}

function spawnPlanet(planet: PlanetPlugin, parentId: number) {
	const planetEntity = new Entity();
	planetEntity.addComponent("identity", {
		name: planet.name,
		description: planet.description,
	});
	planetEntity.addComponent("tags", { tags: planet.tags });
	planetEntity.addComponent("isPlanet", { ...planet.isPlanet });
	planetEntity.addComponent("satellite", {
		...planet.satellite,
		parentId: parentId,
	});

	planetEntity.addComponent("temperature", { temperature: planet.temperature });
	planetEntity.addComponent("population", { count: planet.population });

	return planetEntity;
}
