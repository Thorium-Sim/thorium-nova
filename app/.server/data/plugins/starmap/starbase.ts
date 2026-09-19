import type { StarbasePlugin } from "@thorium/.server/classes/Plugins/Universe/Starbase";
import { findPlanetForMoon } from "@thorium/.server/data/plugins/starmap/planet";
import { pubsub } from "@thorium/.server/init/pubsub";
import { t } from "@thorium/.server/init/t";
import inputAuth from "@thorium/utils/.server/inputAuth";
import { greekLetters } from "@thorium/utils/constants";
import { getPluginTextPatterns, interpolateText } from "@thorium/utils/interpolationEngine";
import { createRNG } from "@thorium/utils/rng";
import { z } from "zod";

export const starbase = t.router({
	create: t.procedure
		.input(z.object({ pluginId: z.string(), solarSystemId: z.string(), planetId: z.string() }))
		.send(({ ctx, input }) => {
			inputAuth(ctx);
			const [system, planet] = findPlanetForMoon(
				ctx,
				input.pluginId,
				input.solarSystemId,
				input.planetId,
			);

			const name = interpolateText(
				`{~${greekLetters.join(",")}} {~Station,Outpost,Depot,Terminal}`,
				{},
				getPluginTextPatterns(ctx.server),
				createRNG(Math.random()),
			);

			const distanceToRadiusRatioRange = [250, 500] as const;

			// We'll just use a default 3D model and dimensions. 1.5 kilometers is big enough to dock the Astra Frigate
			const length = 1500;

			const orbitalArc = Math.random() * 360;
			const semiMajorAxis =
				(length / 1000 / 2) *
				(Math.random() * (distanceToRadiusRatioRange[1] - distanceToRadiusRatioRange[0]) +
					distanceToRadiusRatioRange[0]);

			const starbase: StarbasePlugin = {
				type: "starbase",
				name,
				keyLocation: false,
				description: "",
				tags: [],
				length,
				mass: 700_000_000_000,
				population: 1500,
				satellite: {
					orbitalArc,
					semiMajorAxis,
					showOrbit: true,
					parentId: input.planetId,
					axialTilt: Math.round(Math.random() * 40 * 100) / 100,
					eccentricity: Math.round(Math.random() * 0.02 * 100) / 100,
					inclination: Math.round(Math.random() * 2 * 100) / 100,
				},
				isStarbase: {
					assets: {
						logo: "/plugins/Thorium Default/assets/starbase/logo.svg",
						model: "/plugins/Thorium Default/assets/starbase/model.svg",
						sideView: "/plugins/Thorium Default/assets/starbase/side.svg",
						topView: "/plugins/Thorium Default/assets/starbase/top.svg",
						vanity: "/plugins/Thorium Default/assets/starbase/vanity.svg",
					},
				},
			};

			if (!planet.satellites) {
				planet.satellites = [starbase];
			} else {
				planet.satellites.push(starbase);
			}

			pubsub.publish.plugin.starmap.all({
				pluginId: input.pluginId,
			});
			pubsub.publish.plugin.starmap.get({
				pluginId: input.pluginId,
				solarSystemId: system.name,
			});

			return { planet, starbase };
		}),
});
