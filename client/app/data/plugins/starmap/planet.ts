import PlanetPlugin from "@server/classes/Plugins/Universe/Planet";
import { t } from "@server/init/t";
import { pubsub } from "@server/init/pubsub";
import {
	atmosphericComposition,
	planetClasses,
	planetTypes,
	type Zone,
} from "@server/spawners/planetTypes";
import { generateIncrementedName } from "@server/utils/generateIncrementedName";
import getHabitableZone from "@server/utils/getHabitableZone";
import inputAuth from "@server/utils/inputAuth";
import { randomFromList } from "@server/utils/randomFromList";
import { randomFromRange } from "@server/utils/randomFromRange";
import type { Kelvin, Kilometer, SolarRadius } from "@server/utils/unitTypes";
import romanNumerals from "roman-numerals";
import { z } from "zod";
import { getSolarSystem } from "../utils";
import path from "node:path";
import fs from "node:fs/promises";
import { thoriumPath } from "@server/utils/appPaths";
import { satellite } from "@server/components/satellite";

// Just less than the orbit of Neptune 🥶
const MAX_PLANET_DISTANCE: Kilometer = 4_000_000_000;

// 1/5 the orbit of Mercury 🥵
const MIN_PLANET_DISTANCE: Kilometer = 10_000_000;

function getSemiMajorAxis(
	inputZone: Zone,
	stars: { radius: SolarRadius; temperature: Kelvin }[],
) {
	const biggestStar = stars.reduce(
		(
			prev: { radius: SolarRadius; temperature: Kelvin } | null,
			star: { radius: SolarRadius; temperature: Kelvin },
		) => {
			if (prev === null) return star;
			if (prev.radius > star.radius) return prev;
			return star;
		},
		null,
	);

	let habitableZone = { min: MIN_PLANET_DISTANCE, max: MAX_PLANET_DISTANCE };
	if (biggestStar?.temperature) {
		const tempZone = getHabitableZone(
			biggestStar.radius,
			biggestStar.temperature,
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
			randomFromRange({ min: MIN_PLANET_DISTANCE, max: habitableZone.min }),
		);
	}
	if (zone === "habitable") {
		distance = Math.round(randomFromRange(habitableZone));
	}
	if (zone === "cold") {
		distance = Math.round(
			randomFromRange({ min: habitableZone.max, max: MAX_PLANET_DISTANCE }),
		);
	}

	return distance;
}

export const planet = t.router({
	create: t.procedure
		.input(
			z.object({
				pluginId: z.string(),
				solarSystemId: z.string(),
				planetType: planetClasses,
			}),
		)
		.send(({ ctx, input }) => {
			inputAuth(ctx);
			const system = getSolarSystem(ctx, input.pluginId, input.solarSystemId);
			const childrenPlanets = system.planets;

			const planetType = planetTypes.find(
				(p) => p.classification === input.planetType,
			);
			if (!planetType) {
				throw new Error(`Invalid planet type: ${input.planetType}`);
			}
			const name = generateIncrementedName(
				`${system.name} ${romanNumerals.toRoman(childrenPlanets.length + 1)}`,
				system.planets
					.map((p) => p.name)
					.concat(system.stars.map((star) => star.name))
					.concat(system.name),
			);

			const radius = randomFromRange(planetType.radiusRange);

			const orbitalArc = Math.random() * 360;
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

			pubsub.publish.plugin.starmap.all({
				pluginId: input.pluginId,
			});
			pubsub.publish.plugin.starmap.get({
				pluginId: input.pluginId,
				solarSystemId: system.name,
			});

			return planet;
		}),
	delete: t.procedure
		.input(
			z.object({
				pluginId: z.string(),
				solarSystemId: z.string(),
				planetId: z.string(),
			}),
		)
		.send(({ ctx, input }) => {
			inputAuth(ctx);
			const system = getSolarSystem(ctx, input.pluginId, input.solarSystemId);
			const planet = system.planets.find((s) => s.name === input.planetId);
			if (!system) {
				throw new Error(`No planet found with id ${input.planetId}`);
			}
			system.planets = system.planets.filter((s) => s.name !== input.planetId);

			pubsub.publish.plugin.starmap.all({
				pluginId: input.pluginId,
			});
			pubsub.publish.plugin.starmap.get({
				pluginId: input.pluginId,
				solarSystemId: system.name,
			});

			return planet;
		}),
	update: t.procedure
		.input(
			z.object({
				pluginId: z.string(),
				solarSystemId: z.string(),
				planetId: z.string(),
				name: z.string().optional(),
				age: z.number().optional(),
				classification: planetClasses.optional(),
				radius: z.number().optional(),
				terranMass: z.number().optional(),
				isHabitable: z.boolean().optional(),
				lifeforms: z.string().array().optional(),
				atmosphericComposition: atmosphericComposition.optional(),
				textureMapAsset: z.union([z.string(), z.instanceof(File)]).optional(),
				cloudMapAsset: z
					.union([z.string(), z.instanceof(File), z.null()])
					.optional(),
				ringMapAsset: z
					.union([z.string(), z.instanceof(File), z.null()])
					.optional(),
				population: z.number().optional(),
				temperature: z.number().optional(),
				satellite: z
					.intersection(
						satellite.removeDefault().deepPartial(),
						z.object({ parentId: z.string().optional() }),
					)
					.optional(),
			}),
		)
		.send(async ({ ctx, input }) => {
			inputAuth(ctx);
			const system = getSolarSystem(ctx, input.pluginId, input.solarSystemId);
			const planet = system.planets.find((s) => s.name === input.planetId);
			if (!planet) {
				throw new Error(`No planet found with id ${input.planetId}`);
			}
			if (input.name) {
				planet.name = generateIncrementedName(
					input.name,
					system.planets
						.map((p) => p.name)
						.concat(system.stars.map((star) => star.name))
						.concat(system.name),
				);
			}
			if (typeof input.age === "number") {
				planet.isPlanet.age = input.age;
			}
			// We'll allow updating the planet classification - it's really only useful for the default values
			if (input.classification) {
				planet.isPlanet.classification = input.classification;
			}
			if (typeof input.radius === "number") {
				planet.isPlanet.radius = input.radius;
			}
			if (typeof input.terranMass === "number") {
				planet.isPlanet.terranMass = input.terranMass;
			}
			if (typeof input.isHabitable === "boolean") {
				planet.isPlanet.isHabitable = input.isHabitable;
			}
			if (typeof input.lifeforms === "number") {
				planet.isPlanet.lifeforms = input.lifeforms;
			}
			if (input.satellite) {
				planet.satellite = {
					...planet.satellite,
					...input.satellite,
				};
			}
			if (input.atmosphericComposition) {
				planet.isPlanet.atmosphericComposition = input.atmosphericComposition;
			}

			if (typeof input.textureMapAsset === "string") {
				const ext = path.extname(input.textureMapAsset);
				await moveFile(
					input.textureMapAsset,
					`texture-${planet.name}${ext}`,
					"textureMapAsset",
				);
			}
			if (typeof input.cloudMapAsset === "string") {
				const ext = path.extname(input.cloudMapAsset);
				await moveFile(
					input.cloudMapAsset,
					`cloud-${planet.name}${ext}`,
					"cloudMapAsset",
				);
			}
			if (typeof input.ringMapAsset === "string") {
				const ext = path.extname(input.ringMapAsset);
				await moveFile(
					input.ringMapAsset,
					`ring-${planet.name}${ext}`,
					"ringMapAsset",
				);
			}
			if (input.cloudMapAsset === null) {
				planet.isPlanet.cloudMapAsset = null;
			}
			if (input.ringMapAsset === null) {
				planet.isPlanet.ringMapAsset = null;
			}

			if (typeof input.population === "number") {
				planet.population = input.population;
			}
			if (typeof input.temperature === "number") {
				planet.temperature = input.temperature;
			}

			pubsub.publish.plugin.starmap.all({
				pluginId: input.pluginId,
			});
			pubsub.publish.plugin.starmap.get({
				pluginId: input.pluginId,
				solarSystemId: system.name,
			});

			async function moveFile(
				file: Blob | File | string,
				filePath: string,
				propertyName: "textureMapAsset" | "cloudMapAsset" | "ringMapAsset",
			) {
				if (!system || !planet) return;
				if (typeof file === "string") {
					await fs.mkdir(path.join(thoriumPath, system.assetPath), {
						recursive: true,
					});
					await fs.rename(
						file,
						path.join(thoriumPath, system.assetPath, filePath),
					);
					planet.isPlanet[propertyName] = path.join(system.assetPath, filePath);
				}
			}

			return planet;
		}),
});
