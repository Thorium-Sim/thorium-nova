import type MainComputerPlugin from "@thorium/.server/classes/Plugins/ShipSystems/MainComputer";
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

export const mainComputer = t.router({
	get: t.procedure
		.input(systemInput)
		.filter(pluginFilter)
		.request(({ ctx, input }) => {
			const system = getShipSystem({ input, ctx });
			if (system.type !== "mainComputer")
				throw new Error("System is not Main Computer");

			return system as MainComputerPlugin;
		}),
	update: t.procedure
		.input(
			z.object({
				pluginId: z.string(),
				systemId: z.string(),
				shipPluginId: z.string().optional(),
				shipId: z.string().optional(),

				minDiagnosticEnergyCost: z.number().optional(),
				maxDiagnosticEnergyCost: z.number().optional(),
			}),
		)
		.send(({ ctx, input }) => {
			inputAuth(ctx);
			const [system, override] = getShipSystemForInput<"mainComputer">(
				ctx,
				input,
			);
			const shipSystem = override || system;

			if (typeof input.minDiagnosticEnergyCost === "number") {
				shipSystem.minDiagnosticEnergyCost = Math.max(
					0,
					input.minDiagnosticEnergyCost,
				);
			}
			if (typeof input.maxDiagnosticEnergyCost === "number") {
				shipSystem.maxDiagnosticEnergyCost = Math.max(
					0,
					input.maxDiagnosticEnergyCost,
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
