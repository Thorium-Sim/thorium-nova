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

export const torpedoLauncher = t.router({
	get: t.procedure
		.input(systemInput)
		.filter(pluginFilter)
		.request(({ ctx, input }) => {
			const system = getShipSystem({ input, ctx });

			if (system.type !== "torpedoLauncher")
				throw new Error("System is not Torpedo Launcher");

			return system as TorpedoLauncherPlugin;
		}),
	update: t.procedure
		.input(
			z.object({
				pluginId: z.string(),
				systemId: z.string(),
				shipPluginId: z.string().optional(),
				shipId: z.string().optional(),
				loadTime: z.number().optional(),
				fireTime: z.number().optional(),
				headingDegree: z.number().optional(),
				pitchDegree: z.number().optional(),
			}),
		)
		.send(({ ctx, input }) => {
			inputAuth(ctx);
			const [system, override] = getShipSystemForInput<"torpedoLauncher">(
				ctx,
				input,
			);
			const shipSystem = override || system;

			if (typeof input.loadTime === "number") {
				shipSystem.loadTime = input.loadTime;
			}
			if (typeof input.fireTime === "number") {
				shipSystem.fireTime = input.fireTime;
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
