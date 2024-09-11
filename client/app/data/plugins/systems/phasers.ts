import type TorpedoLauncherPlugin from "@server/classes/Plugins/ShipSystems/TorpedoLauncher";
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
import type PhasersPlugin from "@server/classes/Plugins/ShipSystems/Phasers";

export const phasers = t.router({
	get: t.procedure
		.input(systemInput)
		.filter(pluginFilter)
		.request(({ ctx, input }) => {
			const system = getShipSystem({ input, ctx });

			if (system.type !== "phasers") throw new Error("System is not Phasers");

			return system as PhasersPlugin;
		}),
	update: t.procedure
		.input(
			z.object({
				pluginId: z.string(),
				systemId: z.string(),
				shipPluginId: z.string().optional(),
				shipId: z.string().optional(),
				maxRange: z.number().optional(),
				maxArc: z.number().optional(),
				yieldMultiplier: z.number().optional(),
				headingDegree: z.number().optional(),
				pitchDegree: z.number().optional(),
			}),
		)
		.send(({ ctx, input }) => {
			inputAuth(ctx);
			const [system, override] = getShipSystemForInput<"phasers">(ctx, input);
			const shipSystem = override || system;

			if (typeof input.maxRange === "number") {
				shipSystem.maxRange = input.maxRange;
			}
			if (typeof input.maxArc === "number") {
				shipSystem.maxArc = input.maxArc;
			}
			if (typeof input.yieldMultiplier === "number") {
				shipSystem.yieldMultiplier = input.yieldMultiplier;
			}
			if (typeof input.headingDegree === "number") {
				shipSystem.headingDegree = input.headingDegree;
			}
			if (typeof input.pitchDegree === "number") {
				shipSystem.pitchDegree = input.pitchDegree;
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
