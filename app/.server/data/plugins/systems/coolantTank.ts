import type CoolantTankPlugin from "@thorium/.server/classes/Plugins/ShipSystems/CoolantTank";
import {
	getShipSystem,
	getShipSystemForInput,
	pluginFilter,
	systemInput,
} from "@thorium/.server/data/plugins/utils";
import { pubsub } from "@thorium/.server/init/pubsub";
import { t } from "@thorium/.server/init/t";
import inputAuth from "@thorium/utils/.server/inputAuth";
import z from "zod";

export const coolantTank = t.router({
	get: t.procedure
		.input(systemInput)
		.filter(pluginFilter)
		.request(({ ctx, input }) => {
			const system = getShipSystem({ input, ctx });
			if (system.type !== "coolantTank") throw new Error("System is not Coolant Tank");

			return system as CoolantTankPlugin;
		}),
	update: t.procedure
		.input(
			z.object({
				pluginId: z.string(),
				systemId: z.string(),
				shipPluginId: z.string().optional(),
				shipId: z.string().optional(),

				tankCapacity: z.number().optional(),
				coolantDensity: z.number().optional(),
				coolantSpecificHeat: z.number().optional(),
				pumpBaseFlowRate: z.number().optional(),
				radiatorArea: z.number().optional(),
			}),
		)
		.send(({ ctx, input }) => {
			inputAuth(ctx);
			const [system, override] = getShipSystemForInput<"coolantTank">(ctx, input);
			const shipSystem = override || system;

			if (typeof input.tankCapacity === "number") {
				shipSystem.tankCapacity = Math.max(0, input.tankCapacity);
			}
			if (typeof input.coolantDensity === "number") {
				shipSystem.coolantDensity = Math.max(0, input.coolantDensity);
			}
			if (typeof input.coolantSpecificHeat === "number") {
				shipSystem.coolantSpecificHeat = Math.max(0, input.coolantSpecificHeat);
			}
			if (typeof input.pumpBaseFlowRate === "number") {
				shipSystem.pumpBaseFlowRate = Math.max(0, input.pumpBaseFlowRate);
			}
			if (typeof input.radiatorArea === "number") {
				shipSystem.radiatorArea = Math.max(0, input.radiatorArea);
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
