import type ThrustersPlugin from "@thorium/.server/classes/Plugins/ShipSystems/Thrusters";
import { pubsub } from "@thorium/.server/init/pubsub";
import { t } from "@thorium/.server/init/t";
import inputAuth from "@thorium/utils/.server/inputAuth";
import z from "zod";

import { getShipSystem, getShipSystemForInput, pluginFilter, systemInput } from "../utils";

export const thrusters = t.router({
	get: t.procedure
		.input(systemInput)
		.filter(pluginFilter)
		.request(({ ctx, input }) => {
			const system = getShipSystem({ input, ctx });

			if (system.type !== "thrusters") throw new Error("System is not Thrusters");

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
				directionAcceleration: z.number().optional(),
				rotationMaxSpeed: z.number().optional(),
				rotationAcceleration: z.number().optional(),
			}),
		)
		.send(({ ctx, input }) => {
			inputAuth(ctx);
			const [system, override] = getShipSystemForInput<"thrusters">(ctx, input);
			const shipSystem = override || system;

			if (typeof input.directionMaxSpeed === "number") {
				shipSystem.directionMaxSpeed = input.directionMaxSpeed;
			}
			if (typeof input.directionAcceleration === "number") {
				shipSystem.directionAcceleration = input.directionAcceleration;
			}
			if (typeof input.rotationMaxSpeed === "number") {
				shipSystem.rotationMaxSpeed = input.rotationMaxSpeed;
			}
			if (typeof input.rotationAcceleration === "number") {
				shipSystem.rotationAcceleration = input.rotationAcceleration;
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
