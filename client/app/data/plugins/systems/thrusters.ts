import type ThrustersPlugin from "@server/classes/Plugins/ShipSystems/Thrusters";
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

export const thrusters = t.router({
	get: t.procedure
		.input(systemInput)
		.filter(pluginFilter)
		.request(({ ctx, input }) => {
			const system = getShipSystem({ input, ctx });

			if (system.type !== "thrusters")
				throw new Error("System is not Thrusters");

			return system as ThrustersPlugin;
		}),
	update: t.procedure
		.input(
			z.object({
				pluginId: z.string(),
				systemId: z.string(),
				shipPluginId: z.string().optional(),
				shipId: z.string().optional(),
				directionMaxSpeed: z.number().optional(),
				directionThrust: z.number().optional(),
				rotationMaxSpeed: z.number().optional(),
				rotationThrust: z.number().optional(),
			}),
		)
		.send(({ ctx, input }) => {
			inputAuth(ctx);
			const [system, override] = getShipSystemForInput<"thrusters">(ctx, input);
			const shipSystem = override || system;

			if (typeof input.directionMaxSpeed === "number") {
				shipSystem.directionMaxSpeed = input.directionMaxSpeed;
			}
			if (typeof input.directionThrust === "number") {
				shipSystem.directionThrust = input.directionThrust;
			}
			if (typeof input.rotationMaxSpeed === "number") {
				shipSystem.rotationMaxSpeed = input.rotationMaxSpeed;
			}
			if (typeof input.rotationThrust === "number") {
				shipSystem.rotationThrust = input.rotationThrust;
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
