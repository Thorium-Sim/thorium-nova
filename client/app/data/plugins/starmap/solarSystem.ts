import SolarSystemPlugin from "@server/classes/Plugins/Universe/SolarSystem";
import { t } from "@server/init/t";
import { pubsub } from "@server/init/pubsub";
import { generateIncrementedName } from "@server/utils/generateIncrementedName";
import inputAuth from "@server/utils/inputAuth";
import { z } from "zod";
import { getPlugin } from "../utils";

export const solarSystem = t.router({
	create: t.procedure
		.input(
			z.object({
				pluginId: z.string(),
				position: z.object({
					x: z.number(),
					y: z.number(),
					z: z.number(),
				}),
			}),
		)
		.send(({ ctx, input }) => {
			inputAuth(ctx);
			const plugin = getPlugin(ctx, input.pluginId);
			const solarSystem = new SolarSystemPlugin(
				{ position: input.position },
				plugin,
			);
			plugin.aspects.solarSystems.push(solarSystem);

			pubsub.publish.plugin.starmap.all({ pluginId: input.pluginId });

			return { solarSystemId: solarSystem.name };
		}),
	delete: t.procedure
		.input(
			z.object({
				pluginId: z.string(),
				solarSystemId: z.string(),
			}),
		)
		.send(async ({ ctx, input }) => {
			inputAuth(ctx);
			const plugin = getPlugin(ctx, input.pluginId);
			const solarSystem = plugin.aspects.solarSystems.find(
				(solarSystem) => solarSystem.name === input.solarSystemId,
			);
			if (!solarSystem) return;
			plugin.aspects.solarSystems.splice(
				plugin.aspects.solarSystems.indexOf(solarSystem),
				1,
			);

			await solarSystem?.removeFile();

			pubsub.publish.plugin.starmap.all({ pluginId: input.pluginId });
		}),

	update: t.procedure
		.input(
			z.object({
				pluginId: z.string(),
				solarSystemId: z.string(),
				position: z
					.object({
						x: z.number(),
						y: z.number(),
						z: z.number(),
					})
					.optional(),
				name: z.string().optional(),
				description: z.string().optional(),
				tags: z.string().array().optional(),
				habitableZoneInner: z.number().optional(),
				habitableZoneOuter: z.number().optional(),
				skyboxKey: z.string().optional(),
			}),
		)
		.send(({ ctx, input }) => {
			inputAuth(ctx);
			const plugin = getPlugin(ctx, input.pluginId);
			if (!input.solarSystemId) throw new Error("Solar System ID is required");
			const solarSystem = plugin.aspects.solarSystems.find(
				(solarSystem) => solarSystem.name === input.solarSystemId,
			);
			if (!solarSystem) return { solarSystemId: "" };
			if (input.position) solarSystem.position = input.position;
			if (input.name) {
				const name = generateIncrementedName(
					input.name,
					plugin.aspects.solarSystems.map((solarSystem) => solarSystem.name),
				);
				solarSystem.name = name;
			}
			if (input.description) solarSystem.description = input.description;
			if (input.tags) solarSystem.tags = input.tags;
			if (input.habitableZoneInner)
				solarSystem.habitableZoneInner = input.habitableZoneInner;
			if (input.habitableZoneOuter)
				solarSystem.habitableZoneOuter = input.habitableZoneOuter;
			if (input.skyboxKey) solarSystem.skyboxKey = input.skyboxKey;

			pubsub.publish.plugin.starmap.all({ pluginId: input.pluginId });
			pubsub.publish.plugin.starmap.get({
				pluginId: input.pluginId,
				solarSystemId: solarSystem.name,
			});
			return { solarSystemId: solarSystem.name };
		}),
});
