import { t } from "@server/init/t";
import { z } from "zod";
import { getPlugin, pluginFilter } from "../utils";
import { solarSystem } from "./solarSystem";
import { star } from "./star";
import { planet } from "./planet";

export const starmap = t.router({
	solarSystem,
	star,
	planet,
	all: t.procedure
		.input(z.object({ pluginId: z.string() }))
		.filter(pluginFilter)
		.request(({ ctx, input }) => {
			const plugin = getPlugin(ctx, input.pluginId);
			return plugin.aspects.solarSystems.map((solarSystem) => ({
				name: solarSystem.name,
				position: solarSystem.position,
				description: solarSystem.description,
			}));
		}),
	get: t.procedure
		.input(z.object({ pluginId: z.string(), solarSystemId: z.string() }))
		.filter(
			(
				publish: { pluginId: string; solarSystemId: string } | null,
				{ input },
			) => {
				if (!publish) return true;
				if (publish && input.pluginId !== publish.pluginId) return false;
				if (publish && input.solarSystemId !== publish.solarSystemId)
					return false;
				return true;
			},
		)
		.request(({ ctx, input }) => {
			const plugin = getPlugin(ctx, input.pluginId);
			const solarSystem = plugin.aspects.solarSystems.find(
				(solarSystem) => solarSystem.name === input.solarSystemId,
			);
			if (!solarSystem) throw null;
			return solarSystem;
		}),
});
