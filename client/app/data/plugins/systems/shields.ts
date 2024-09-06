import type ShieldsPlugin from "@server/classes/Plugins/ShipSystems/Shields";
import { t } from "@server/init/t";
import { pubsub } from "@server/init/pubsub";
import inputAuth from "@server/utils/inputAuth";
import { z } from "zod";
import {
	getShipSystem,
	getShipSystemForInput,
	pluginFilter,
	systemInput,
} from "../utils";

export const shields = t.router({
	get: t.procedure
		.input(systemInput)
		.filter(pluginFilter)
		.request(({ ctx, input }) => {
			const system = getShipSystem({ input, ctx });

			if (system.type !== "shields") throw new Error("System is not Shields");

			return system as ShieldsPlugin;
		}),
	update: t.procedure
		.input(
			z.object({
				pluginId: z.string(),
				systemId: z.string(),
				shipPluginId: z.string().optional(),
				shipId: z.string().optional(),
				maxStrength: z.number().optional(),
				shieldCount: z
					.union([z.literal(1), z.literal(4), z.literal(6)])
					.optional(),
			}),
		)
		.send(({ ctx, input }) => {
			inputAuth(ctx);
			const [system, override] = getShipSystemForInput<"shields">(ctx, input);
			const shipSystem = override || system;

			if (typeof input.maxStrength === "number") {
				shipSystem.maxStrength = input.maxStrength;
			}
			if (typeof input.shieldCount === "number") {
				shipSystem.shieldCount = input.shieldCount;
			}

			pubsub.publish.plugin.systems.get({
				pluginId: input.pluginId,
			});
			pubsub.publish.plugin.systems.shields.get({
				pluginId: input.pluginId,
			});
			if (input.shipPluginId && input.shipId) {
				pubsub.publish.plugin.ship.get({
					pluginId: input.shipPluginId,
					shipId: input.shipId,
				});
			}

			return shipSystem;
		}),
});
