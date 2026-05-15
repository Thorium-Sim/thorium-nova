import type ShortRangeCommPlugin from "@thorium/.server/classes/Plugins/ShipSystems/ShortRangeComm";
import { pubsub } from "@thorium/.server/init/pubsub";
import { t } from "@thorium/.server/init/t";
import inputAuth from "@thorium/utils/.server/inputAuth";
import z from "zod";

import { getShipSystem, getShipSystemForInput, pluginFilter, systemInput } from "../utils";

export const shortRangeComm = t.router({
	get: t.procedure
		.input(systemInput)
		.filter(pluginFilter)
		.request(({ ctx, input }) => {
			const system = getShipSystem({ input, ctx });

			if (system.type !== "shortRangeComm") throw new Error("System is not Short Range Comm");

			return system as ShortRangeCommPlugin;
		}),
	update: t.procedure
		.input(
			z.object({
				pluginId: z.string(),
				systemId: z.string(),
				shipPluginId: z.string().optional(),
				shipId: z.string().optional(),
				minRadius: z.number().optional(),
				maxRadius: z.number().optional(),
			}),
		)
		.send(({ ctx, input }) => {
			inputAuth(ctx);
			const [system, override] = getShipSystemForInput<"shortRangeComm">(ctx, input);
			const shipSystem = override || system;

			if (typeof input.maxRadius === "number") {
				shipSystem.maxRadius = input.maxRadius;
			}
			if (typeof input.minRadius === "number") {
				shipSystem.minRadius = input.minRadius;
			}

			pubsub.publish.plugin.systems.get({
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
