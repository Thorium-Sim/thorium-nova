import path from "node:path";

import type PlanetPlugin from "@thorium/.server/classes/Plugins/Universe/Planet";
import type SolarSystemPlugin from "@thorium/.server/classes/Plugins/Universe/SolarSystem";
import type StarPlugin from "@thorium/.server/classes/Plugins/Universe/Star";
import type { StarbasePlugin } from "@thorium/.server/classes/Plugins/Universe/Starbase";
import { getMeshSize } from "@thorium/.server/spawners/ship";
import { thoriumContext } from "@thorium/utils/.server/context";
import { Entity } from "@thorium/utils/ecs";
import { getOrbitPosition } from "@thorium/utils/starmap/getOrbitPosition";
import { Vector3 } from "three";

export async function spawnSolarSystem(
	systemPlugin: SolarSystemPlugin,
): Promise<{ entity: Entity; key: string }[]> {
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
	const planets = (
		await Promise.all(
			systemPlugin.planets.map(async (planet) => {
				const entity = spawnPlanet(planet, system.id);
				const satellites =
					(await Promise.all(
						planet.satellites?.map(async (satellite) => ({
							key: `${systemPlugin.pluginName}-${systemPlugin.name}-${satellite.name}`,
							entity:
								satellite.type === "starbase"
									? await spawnStarbase(
											satellite,
											system.id,
											getOrbitPosition({ ...planet.satellite }),
										)
									: spawnPlanet(satellite, entity.id),
						})) || [],
					)) || [];

				return [
					{
						key: `${systemPlugin.pluginName}-${systemPlugin.name}-${planet.name}`,
						entity,
					},
					...satellites,
				];
			}),
		)
	).flat();

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

async function spawnStarbase(starbase: StarbasePlugin, systemId: number, origin: Vector3) {
	const starbaseEntity = new Entity();

	starbaseEntity.addComponent("identity", {
		name: starbase.name,
		description: starbase.description,
	});
	starbaseEntity.addComponent("tags", { tags: starbase.tags });
	starbaseEntity.addComponent("isStarbase", { ...starbase.isStarbase });
	starbaseEntity.addComponent("mass", { mass: starbase.mass });

	const modelPath = path.join(
		thoriumContext.getStore()?.thoriumPath || "",
		starbase.isStarbase.assets!.model!,
	);
	const size =
		modelPath && modelPath !== "." ? await getMeshSize(modelPath) : new Vector3(10, 10, 10);

	size.multiplyScalar(starbase.length || 1);
	starbaseEntity.addComponent("size", {
		length: size.x,
		width: size.y,
		height: size.z,
	});

	starbaseEntity.addComponent("size", { length: starbase.length });
	// Convert the starbase satellite position into a regular position
	const position = getOrbitPosition({ ...starbase.satellite, origin });
	starbaseEntity.addComponent("position", {
		type: "solar",
		x: position.x,
		y: position.y,
		z: position.z,
		parentId: systemId,
	});
	starbaseEntity.addComponent("rotation");
	starbaseEntity.addComponent("velocity");
	starbaseEntity.addComponent("rotationVelocity");

	starbaseEntity.addComponent("physicsHandles");
	starbaseEntity.addComponent("population", { count: starbase.population });

	return starbaseEntity;
}
