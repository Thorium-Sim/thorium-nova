import type ExocompsPlugin from "@thorium/.server/classes/Plugins/ShipSystems/Exocomps";
import { pubsub } from "@thorium/.server/init/pubsub";
import { t } from "@thorium/.server/init/t";
import inputAuth from "@thorium/utils/.server/inputAuth";
import z from "zod";

import { getShipSystem, getShipSystemForInput, pluginFilter, systemInput } from "../utils";

export const exocomps = t.router({
	get: t.procedure
		.input(systemInput)
		.filter(pluginFilter)
		.request(({ ctx, input }) => {
			const system = getShipSystem({ input, ctx });

			if (system.type !== "exocomps") throw new Error("System is not Exocomps");

			return system as ExocompsPlugin;
		}),
	update: t.procedure
		.input(
			z.object({
				pluginId: z.string(),
				systemId: z.string(),
				shipPluginId: z.string().optional(),
				shipId: z.string().optional(),
				exocompName: z.string().optional(),
				exocompCount: z.number().int().optional(),
				exocompMaxCharge: z.number().optional(),
				exocompChargeRate: z.number().optional(),
				exocompIdleDischargeRate: z.number().optional(),
				exocompWorkingDischargeRate: z.number().optional(),
				exocompMovingDischargeRate: z.number().optional(),
				exocompMovementSpeed: z.number().optional(),
				exocompCargoVolume: z.number().optional(),
			}),
		)
		.send(({ ctx, input }) => {
			inputAuth(ctx);
			const [system, override] = getShipSystemForInput<"exocomps">(ctx, input);
			const shipSystem = override || system;

			for (const key in input) {
				if (["pluginId", "systemId", "shipId", "shipPluginId"].includes(key)) continue;
				const inputKey = key as keyof Omit<
					typeof input,
					"pluginId" | "systemId" | "shipId" | "shipPluginId"
				>;
				if (typeof input[inputKey] !== "undefined") {
					shipSystem[inputKey] = input[inputKey];
				}
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
