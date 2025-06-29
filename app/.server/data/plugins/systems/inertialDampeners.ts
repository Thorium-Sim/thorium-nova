import type InertialDampenersPlugin from "@thorium/.server/classes/Plugins/ShipSystems/InertialDampeners";
import { t } from "@thorium/.server/init/t";
import { pubsub } from "@thorium/.server/init/pubsub";
import inputAuth from "@thorium/utils/.server/inputAuth";
import { z } from "zod";
import {
	getShipSystem,
	getShipSystemForInput,
	pluginFilter,
	systemInput,
} from "../utils";

export const inertialDampeners = t.router({
	get: t.procedure
		.input(systemInput)
		.filter(pluginFilter)
		.request(({ ctx, input }) => {
			const system = getShipSystem({ input, ctx });

			if (system.type !== "inertialDampeners")
				throw new Error("System is not Inertial Dampeners");

			return system as InertialDampenersPlugin;
		}),
	update: t.procedure
		.input(
			z.object({
				pluginId: z.string(),
				systemId: z.string(),
				shipPluginId: z.string().optional(),
				shipId: z.string().optional(),
				dampening: z.number().optional(),
			}),
		)
		.send(({ ctx, input }) => {
			inputAuth(ctx);
			const [system, override] = getShipSystemForInput<"inertialDampeners">(
				ctx,
				input,
			);
			const shipSystem = override || system;

			if (typeof input.dampening === "number" && input.dampening > 0) {
				shipSystem.dampening = input.dampening;
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
