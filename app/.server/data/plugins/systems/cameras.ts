import { pubsub } from "@thorium/.server/init/pubsub";
import { t } from "@thorium/.server/init/t";
import inputAuth from "@thorium/utils/.server/inputAuth";
import { z } from "zod";
import {
	getShipSystem,
	getShipSystemForInput,
	pluginFilter,
	systemInput,
} from "../utils";
import type CamerasPlugin from "@thorium/.server/classes/Plugins/ShipSystems/Cameras";

export const cameras = t.router({
	get: t.procedure
		.input(systemInput)
		.filter(pluginFilter)
		.request(({ ctx, input }) => {
			const system = getShipSystem({ input, ctx });

			if (system.type !== "cameras")
				throw new Error("System is not Cameras");

			return system as CamerasPlugin;
		}),
	update: t.procedure
		.input(
			z.object({
				pluginId: z.string(),
				systemId: z.string(),
				shipPluginId: z.string().optional(),
				shipId: z.string().optional(),
				fov: z.number().min(10).max(120).optional(),
			}),
		)
		.send(({ ctx, input }) => {
			inputAuth(ctx);
			const [system, override] = getShipSystemForInput<"cameras">(
				ctx,
				input,
			);
			const shipSystem = override || system;

			if (typeof input.fov !== "undefined") {
				shipSystem.fov = input.fov;
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
