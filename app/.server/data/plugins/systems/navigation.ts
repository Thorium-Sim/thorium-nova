import type NavigationPlugin from "@thorium/.server/classes/Plugins/ShipSystems/Navigation";
import { pubsub } from "@thorium/.server/init/pubsub";
import { t } from "@thorium/.server/init/t";
import inputAuth from "@thorium/utils/.server/inputAuth";
import z from "zod";

import { getShipSystem, getShipSystemForInput, pluginFilter, systemInput } from "../utils";

export const navigation = t.router({
	get: t.procedure
		.input(systemInput)
		.filter(pluginFilter)
		.request(({ ctx, input }) => {
			const system = getShipSystem({ input, ctx });

			if (system.type !== "navigation") throw new Error("System is not Navigation");

			return system as NavigationPlugin;
		}),
	update: t.procedure
		.input(
			z.object({
				pluginId: z.string(),
				systemId: z.string(),
				shipPluginId: z.string().optional(),
				shipId: z.string().optional(),
				calculate: z.boolean().optional(),
				thrusters: z.boolean().optional(),
				destinations: z.string().array().optional(),
				presets: z
					.object({
						name: z.string(),
						course: z.object({ x: z.number(), y: z.number(), z: z.number() }),
					})
					.array()
					.optional(),
			}),
		)
		.send(({ ctx, input }) => {
			inputAuth(ctx);
			const [system, override] = getShipSystemForInput<"navigation">(ctx, input);
			const shipSystem = override || system;

			if (typeof input.calculate !== "undefined") {
				shipSystem.calculate = input.calculate;
			}

			if (typeof input.thrusters !== "undefined") {
				shipSystem.thrusters = input.thrusters;
			}

			if (typeof input.destinations !== "undefined") {
				shipSystem.destinations = input.destinations;
			}

			if (typeof input.presets !== "undefined") {
				shipSystem.presets = input.presets;
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
