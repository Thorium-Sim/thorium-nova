import type WarpEnginesPlugin from "@thorium/.server/classes/Plugins/ShipSystems/warpEngines";
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
import { engineSpeeds } from "@thorium/ecs-components/shipSystems/engineSpeeds";

export const warp = t.router({
	get: t.procedure
		.input(systemInput)
		.filter(pluginFilter)
		.request(({ ctx, input }) => {
			const system = getShipSystem({ input, ctx });

			if (system.type !== "warpEngines")
				throw new Error("System is not Warp Engine");

			return system as WarpEnginesPlugin;
		}),
	update: t.procedure
		.input(
			z.object({
				pluginId: z.string(),
				systemId: z.string(),
				shipPluginId: z.string().optional(),
				shipId: z.string().optional(),
				interstellarCruisingSpeed: z.number().optional(),
				solarCruisingSpeed: z.number().optional(),
				minSpeedMultiplier: z.number().optional(),
				speeds: engineSpeeds.optional(),
			}),
		)
		.send(({ ctx, input }) => {
			inputAuth(ctx);
			const [system, override] = getShipSystemForInput<"warpEngines">(
				ctx,
				input,
			);

			const shipSystem = override || system;

			if (typeof input.minSpeedMultiplier === "number") {
				if (input.minSpeedMultiplier < 0)
					throw new Error("minSpeedMultiplier must be >= 0");
				shipSystem.minSpeedMultiplier = input.minSpeedMultiplier;
			}
			if (typeof input.interstellarCruisingSpeed === "number") {
				shipSystem.interstellarCruisingSpeed = input.interstellarCruisingSpeed;
			}
			if (typeof input.solarCruisingSpeed === "number") {
				shipSystem.solarCruisingSpeed = input.solarCruisingSpeed;
			}
			if (Array.isArray(input.speeds)) {
				shipSystem.speeds = input.speeds;
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
