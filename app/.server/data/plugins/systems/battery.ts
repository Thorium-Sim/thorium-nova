import type BatteryPlugin from "@thorium/.server/classes/Plugins/ShipSystems/Battery";
import { pubsub } from "@thorium/.server/init/pubsub";
import { t } from "@thorium/.server/init/t";
import inputAuth from "@thorium/utils/.server/inputAuth";
import z from "zod";

import { getShipSystem, getShipSystemForInput, pluginFilter, systemInput } from "../utils";

export const battery = t.router({
	get: t.procedure
		.input(systemInput)
		.filter(pluginFilter)
		.request(({ ctx, input }) => {
			const system = getShipSystem({ input, ctx });

			if (system.type !== "battery") throw new Error("System is not Battery");

			return system as BatteryPlugin;
		}),
	update: t.procedure
		.input(
			z.object({
				pluginId: z.string(),
				systemId: z.string(),
				shipPluginId: z.string().optional(),
				shipId: z.string().optional(),
				capacity: z.number().optional(),
				chargeRate: z.number().optional(),
				outputRate: z.number().optional(),
			}),
		)
		.send(({ ctx, input }) => {
			inputAuth(ctx);
			const [system, override] = getShipSystemForInput<"battery">(ctx, input);
			const shipSystem = override || system;

			if (typeof input.capacity === "number") {
				shipSystem.capacity = Math.max(0, input.capacity);
			}
			if (typeof input.chargeRate === "number") {
				shipSystem.chargeRate = Math.max(0, input.chargeRate);
			}
			if (typeof input.outputRate === "number") {
				shipSystem.outputRate = Math.max(0, input.outputRate);
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
