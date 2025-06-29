import type SensorsPlugin from "@thorium/.server/classes/Plugins/ShipSystems/Sensors";
import {
	getShipSystem,
	getShipSystemForInput,
	pluginFilter,
	systemInput,
} from "@thorium/.server/data/plugins/utils";
import { pubsub } from "@thorium/.server/init/pubsub";
import { t } from "@thorium/.server/init/t";
import inputAuth from "@thorium/utils/.server/inputAuth";
import { z } from "zod";

export const sensors = t.router({
	get: t.procedure
		.input(systemInput)
		.filter(pluginFilter)
		.request(({ ctx, input }) => {
			const system = getShipSystem({ input, ctx });
			if (system.type !== "sensors") throw new Error("System is not Sensors");

			return system as SensorsPlugin;
		}),
	update: t.procedure
		.input(
			z.object({
				pluginId: z.string(),
				systemId: z.string(),
				shipPluginId: z.string().optional(),
				shipId: z.string().optional(),

				passiveRange: z.number().optional(),
				activeRange: z.number().optional(),
				minScanEnergyCost: z.number().optional(),
				maxScanEnergyCost: z.number().optional(),
				shieldPenaltyMultiplier: z.number().optional(),
			}),
		)
		.send(({ ctx, input }) => {
			inputAuth(ctx);
			const [system, override] = getShipSystemForInput<"sensors">(ctx, input);
			const shipSystem = override || system;

			if (typeof input.passiveRange === "number") {
				shipSystem.passiveRange = Math.max(0, input.passiveRange);
			}
			if (typeof input.activeRange === "number") {
				shipSystem.activeRange = Math.max(0, input.activeRange);
			}
			if (typeof input.minScanEnergyCost === "number") {
				shipSystem.minScanEnergyCost = Math.max(0, input.minScanEnergyCost);
			}
			if (typeof input.maxScanEnergyCost === "number") {
				shipSystem.maxScanEnergyCost = Math.max(0, input.maxScanEnergyCost);
			}
			if (typeof input.shieldPenaltyMultiplier === "number") {
				shipSystem.shieldPenaltyMultiplier = Math.max(
					0,
					input.shieldPenaltyMultiplier,
				);
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
