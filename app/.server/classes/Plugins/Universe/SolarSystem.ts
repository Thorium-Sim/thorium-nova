import { isPlanet } from "@thorium/ecs-components/list";
import { satellite } from "@thorium/ecs-components/satellite";
import { UNIVERSE_RADIUS } from "@thorium/utils/constants";
import { spectralTypes } from "@thorium/utils/flags/starTypes";
import SystemNames from "@thorium/utils/flags/systemNames";
import { generateIncrementedName } from "@thorium/utils/generateIncrementedName";
import { randomFromList } from "@thorium/utils/operations/randomFromList";
import type { AstronomicalUnit, LightMinute } from "@thorium/utils/unitTypes";
import z from "zod";

import type BasePlugin from "..";
import { Aspect } from "../Aspect";
import PlanetPlugin from "./Planet";
import StarPlugin from "./Star";

const basePlanetSchema = z.object({
	name: z.string(),
	description: z.string(),
	tags: z.string().array(),
	keyLocation: z.boolean().optional(),
	satellite: satellite._def.innerType.extend({ parentId: z.string() }),
	isPlanet,
	population: z.number(),
	temperature: z.number(),
});
const planetSchema = basePlanetSchema.extend({
	satellites: z.lazy(() => basePlanetSchema.array()).optional(),
});
export default class SolarSystemPlugin extends Aspect {
	static schema = z.object({
		name: z.string(),
		description: z.string(),
		position: z.object({
			x: z.number(),
			y: z.number(),
			z: z.number(),
		}),
		tags: z.string().array(),
		habitableZoneInner: z.number(),
		habitableZoneOuter: z.number(),
		skyboxKey: z.string(),
		stars: z
			.object({
				name: z.string(),
				description: z.string(),
				tags: z.string().array(),
				solarMass: z.number(),
				age: z.number(),
				spectralType: spectralTypes,
				hue: z.number(),
				isWhite: z.boolean(),
				radius: z.number(),
				temperature: z.number(),
				satellite: satellite._def.innerType.extend({ parentId: z.string() }),
			})
			.array(),
		planets: planetSchema.array(),
		commSatellite: z.object({ radius: z.number() }).nullable(),
		assets: z.object({}),
	});
	apiVersion = "solarSystem/v1" as const;
	kind = "solarSystems" as const;
	name: string;
	description: string;

	/**
	 * Position of the solar system in the universe. Measured in light minutes.
	 */
	position: {
		x: LightMinute;
		y: LightMinute;
		z: LightMinute;
	};

	tags: string[];

	/**
	 * The inner radius of the habitable zone of the system in AU.
	 */
	habitableZoneInner: AstronomicalUnit;
	/**
	 * The outer radius of the habitable zone of the system in AU.
	 */
	habitableZoneOuter: AstronomicalUnit;
	/**
	 * A string key that is used to procedurally generate the nebula skybox background in this system in the viewscreen.
	 */
	skyboxKey: string;
	stars!: StarPlugin[];
	planets!: PlanetPlugin[];

	commSatellite: { radius: number } | null = null;
	assets = {};

	constructor(params: Partial<SolarSystemPlugin>, plugin: BasePlugin) {
		let name = params.name;
		if (!name) {
			const starNames = plugin.aspects.solarSystems.map((s) => s.name);
			const availableNames = SystemNames.filter((val) => !starNames.includes(val));

			name = randomFromList(availableNames) || "Bob"; // If this happens, I'll laugh very hard.
		}
		name = generateIncrementedName(
			name || "New Solar System",
			plugin.aspects.solarSystems.map((solarSystem) => solarSystem.name),
		);

		super({ name, ...params }, { kind: "solarSystems" }, plugin);
		this.name = name;
		this.description = `A solar system named ${name}`;

		this.position = params.position || {
			x: UNIVERSE_RADIUS * 2 * (Math.random() - 0.5),
			y: UNIVERSE_RADIUS * 2 * (Math.random() - 0.5),
			z: UNIVERSE_RADIUS * 2 * (Math.random() - 0.5),
		};

		this.tags = params.tags || [];

		this.habitableZoneInner = params.habitableZoneInner || 0.9;
		this.habitableZoneOuter = params.habitableZoneOuter || 3.0;
		this.skyboxKey = params.skyboxKey || "Random Key";

		this.stars ??= params.stars?.map((star) => new StarPlugin(star, this)) ?? [];
		this.planets ??= params.planets?.map((planet) => new PlanetPlugin(planet)) ?? [];

		this.commSatellite = params.commSatellite || null;
	}
}
