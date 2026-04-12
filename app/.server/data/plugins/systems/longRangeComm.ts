import { pubsub } from "@thorium/.server/init/pubsub";
import { t } from "@thorium/.server/init/t";
import inputAuth from "@thorium/utils/.server/inputAuth";
import z from "zod";
import {
	getShipSystem,
	getShipSystemForInput,
	pluginFilter,
	systemInput,
} from "../utils";
import type LongRangeCommPlugin from "@thorium/.server/classes/Plugins/ShipSystems/LongRangeComm";
import { getAlphabet } from "@thorium/utils/getAlphabet";

export const longRangeComm = t.router({
	get: t.procedure
		.input(systemInput)
		.filter(pluginFilter)
		.request(({ ctx, input }) => {
			const system = getShipSystem({ input, ctx });

			if (system.type !== "longRangeComm")
				throw new Error("System is not Long Range Comm");

			return system as LongRangeCommPlugin;
		}),
	addCode: t.procedure
		.input(
			z.object({
				pluginId: z.string(),
				systemId: z.string(),
				shipPluginId: z.string().optional(),
				shipId: z.string().optional(),
				file: z.instanceof(File),
			}),
		)
		.send(async ({ ctx, input }) => {
			inputAuth(ctx);
			const [system, override] = getShipSystemForInput<"longRangeComm">(
				ctx,
				input,
			);
			const shipSystem = override || system;
			if (!shipSystem || "soundEffects" in shipSystem === false) {
				return;
			}
			const filePath = input.file.name;
			const url = await ctx.uploadFile.call(system, input.file, filePath);

			if (!shipSystem.cyphers) {
				shipSystem.cyphers = [];
			}
			shipSystem.cyphers.push({
				code: [
					getAlphabet(Math.floor(Math.random() * 26)),
					getAlphabet(Math.floor(Math.random() * 26)),
					getAlphabet(Math.floor(Math.random() * 26)),
					getAlphabet(Math.floor(Math.random() * 26)),
					"-",
					Math.floor(Math.random() * 999),
				]
					.join("")
					.toUpperCase(),
				name: filePath,
				font: url,
				active: true,
			});
			pubsub.publish.plugin.systems.get({
				pluginId: input.pluginId,
			});
			if (input.shipPluginId && input.shipId) {
				pubsub.publish.plugin.ship.get({
					pluginId: input.shipPluginId,
					shipId: input.shipId,
				});
			}
		}),
	update: t.procedure
		.input(
			z.object({
				pluginId: z.string(),
				systemId: z.string(),
				shipPluginId: z.string().optional(),
				shipId: z.string().optional(),
				cyphers: z
					.object({
						code: z.string(),
						name: z.string(),
						active: z.boolean(),
					})
					.array()
					.optional(),
				chargeRate: z.number().optional(),
				dischargeRate: z.number().optional(),
			}),
		)
		.send(({ ctx, input }) => {
			inputAuth(ctx);
			const [system, override] = getShipSystemForInput<"longRangeComm">(
				ctx,
				input,
			);
			const shipSystem = override || system;

			if (typeof input.cyphers !== "undefined") {
				shipSystem.cyphers = input.cyphers;
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
