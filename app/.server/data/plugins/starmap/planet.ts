import path from "node:path";

import PlanetPlugin from "@thorium/.server/classes/Plugins/Universe/Planet";
import { pubsub } from "@thorium/.server/init/pubsub";
import { t } from "@thorium/.server/init/t";
import { satellite } from "@thorium/ecs-components/satellite";
import inputAuth from "@thorium/utils/.server/inputAuth";
import {
	atmosphericComposition,
	planetClasses,
	planetTypes,
	type Zone,
} from "@thorium/utils/flags/planetTypes";
import { generateIncrementedName } from "@thorium/utils/generateIncrementedName";
import { randomFromList } from "@thorium/utils/operations/randomFromList";
import { randomFromRange } from "@thorium/utils/operations/randomFromRange";
import getHabitableZone from "@thorium/utils/starmap/getHabitableZone";
import type { Kelvin, Kilometer, SolarRadius } from "@thorium/utils/unitTypes";
import z from "zod";

import { getSolarSystem } from "../utils";

// Just less than the orbit of Neptune 🥶
const MAX_PLANET_DISTANCE: Kilometer = 4_000_000_000;

// 1/5 the orbit of Mercury 🥵
const MIN_PLANET_DISTANCE: Kilometer = 10_000_000;

function getSemiMajorAxis(inputZone: Zone, stars: { radius: SolarRadius; temperature: Kelvin }[]) {
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
		const tempZone = getHabitableZone(biggestStar.radius, biggestStar.temperature);
		habitableZone = {
			min: Math.max(tempZone.min, MIN_PLANET_DISTANCE),
			max: Math.min(tempZone.max, MAX_PLANET_DISTANCE),
		};
	}
	let distance = 0;
	const zone = randomFromList(inputZone);
	if (zone === "hot") {
		distance = Math.round(randomFromRange({ min: MIN_PLANET_DISTANCE, max: habitableZone.min }));
	}
	if (zone === "habitable") {
		distance = Math.round(randomFromRange(habitableZone));
	}
	if (zone === "cold") {
		distance = Math.round(randomFromRange({ min: habitableZone.max, max: MAX_PLANET_DISTANCE }));
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

			const planetType = planetTypes.find((p) => p.classification === input.planetType);
			if (!planetType) {
				throw new Error(`Invalid planet type: ${input.planetType}`);
			}
			const name = generateIncrementedName(
				`${system.name} ${childrenPlanets.length + 1}`,
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
	addMoon: t.procedure
		.input(
			z.object({
				pluginId: z.string(),
				solarSystemId: z.string(),
				planetId: z.string(),
				planetType: planetClasses,
			}),
		)
		.send(({ ctx, input }) => {
			inputAuth(ctx);
			const system = getSolarSystem(ctx, input.pluginId, input.solarSystemId);

			const planet = system.planets.reduce((prev: PlanetPlugin | null, next) => {
				if (prev) return prev;
				if (next.name === input.planetId) return next;
				return next.satellites?.find((moon) => moon.name === input.planetId) || null;
			}, null);

			if (!planet) {
				throw new Error(`No planet found with id ${input.planetId}`);
			}

			const planetType = planetTypes.find((p) => p.classification === input.planetType);
			if (!planetType) {
				throw new Error(`Invalid planet type: ${input.planetType}`);
			}
			const name = generateIncrementedName(
				`${planet.name}${["a", "b", "c", "d", "e", "f", "g", "h", "i"][planet.satellites?.length ?? 0]}`,
				system.planets
					.map((p) => p.name)
					.concat(system.stars.map((star) => star.name))
					.concat(system.name),
			);

			const distanceToRadiusRatioRange = [250, 500] as const;
			const planetToMoonRadiusRatioRange = [0.05, 0.25] as const;

			const [min, max] = planetToMoonRadiusRatioRange;
			const radius = planet.isPlanet.radius * (Math.random() * (max - min) + min);

			const orbitalArc = Math.random() * 360;
			const semiMajorAxis =
				radius *
				(Math.random() * (distanceToRadiusRatioRange[1] - distanceToRadiusRatioRange[0]) +
					distanceToRadiusRatioRange[0]);

			const moon: PlanetPlugin = {
				name,
				description: "",
				tags: [],
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
					ringMapAsset: null,
				},
				satellite: {
					orbitalArc,
					semiMajorAxis,
					showOrbit: true,
					parentId: input.planetId,
					axialTilt: Math.round(Math.random() * 40 * 100) / 100,
					eccentricity: Math.round(Math.random() * 0.02 * 100) / 100,
					inclination: Math.round(Math.random() * 2 * 100) / 100,
				},
				population:
					typeof planetType.population === "number"
						? planetType.population
						: randomFromRange(planetType.population),
				temperature: randomFromRange(planetType.temperatureRange),
				satellites: [],
			};
			if (!planet.satellites) {
				planet.satellites = [moon];
			} else {
				planet.satellites.push(moon);
			}

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
				textureMapAsset: z.instanceof(File).nullish(),
				cloudMapAsset: z.instanceof(File).nullish(),
				ringMapAsset: z.instanceof(File).nullish(),
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
			const planet = system.planets.reduce((prev: PlanetPlugin | null, next) => {
				if (prev) return prev;
				if (next.name === input.planetId) return next;
				return next.satellites?.find((moon) => moon.name === input.planetId) || null;
			}, null);

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

			if (input.textureMapAsset instanceof File) {
				const ext = path.extname(input.textureMapAsset.name);
				planet.isPlanet.textureMapAsset = await ctx.uploadFile.call(
					system,
					input.textureMapAsset,
					`texture-${planet.name}${ext}`,
				);
			}
			if (input.cloudMapAsset instanceof File) {
				const ext = path.extname(input.cloudMapAsset.name);
				planet.isPlanet.cloudMapAsset = await ctx.uploadFile.call(
					system,
					input.cloudMapAsset,
					`cloud-${planet.name}${ext}`,
				);
			}
			if (input.ringMapAsset instanceof File) {
				const ext = path.extname(input.ringMapAsset.name);
				planet.isPlanet.ringMapAsset = await ctx.uploadFile.call(
					system,
					input.ringMapAsset,
					`ring-${planet.name}${ext}`,
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

			return planet;
		}),
});
