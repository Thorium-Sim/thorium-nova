import path from "node:path";

import ShipPlugin, { shipCategories } from "@thorium/.server/classes/Plugins/Ship";
import { pubsub } from "@thorium/.server/init/pubsub";
import { t } from "@thorium/.server/init/t";
import inputAuth from "@thorium/utils/.server/inputAuth";
import uniqid from "@thorium/utils/uniqid";
import z from "zod";

import { deck } from "./deck";
import { getPlugin } from "./utils";

export const ship = t.router({
	deck,
	all: t.procedure
		.input(z.object({ pluginId: z.string() }))
		.filter((publish: { pluginId: string } | null, { input }) => {
			if (!publish || publish.pluginId === input.pluginId) return true;
			return false;
		})
		.request(({ ctx, input }) => {
			const plugin = getPlugin(ctx, input.pluginId);
			return plugin.aspects.ships;
		}),
	get: t.procedure
		.input(z.object({ pluginId: z.string(), shipId: z.string() }))
		.filter((publish: { pluginId: string; shipId: string } | null, { input }) => {
			if (!publish || publish.pluginId === input.pluginId) return true;
			return false;
		})
		.request(({ ctx, input }) => {
			const plugin = getPlugin(ctx, input.pluginId);
			const ship = plugin.aspects.ships.find((ship) => ship.name === input.shipId);
			if (!ship) throw null;
			return ship;
		}),
	available: t.procedure.request(({ ctx }) => {
		return ctx.server.plugins
			.reduce((ships: ShipPlugin[], plugin) => {
				if (!plugin.active) return ships;
				// TODO November 13, 2021 - Filter out ships that don't have the necessary
				// components for being a player ship.
				return ships.concat(plugin.aspects.ships);
			}, [])
			.map((ship) => ({
				name: ship.name,
				description: ship.description,
				vanityUrl: ship.assets.vanity,
				pluginName: ship.pluginName,
			}));
	}),
	create: t.procedure
		.input(z.object({ pluginId: z.string(), name: z.string() }))
		.send(async ({ ctx, input }) => {
			inputAuth(ctx);
			const plugin = getPlugin(ctx, input.pluginId);
			const ship = await ShipPlugin.create({ name: input.name }, plugin);
			plugin.aspects.ships.push(ship);

			pubsub.publish.plugin.ship.all({ pluginId: input.pluginId });
			pubsub.publish.plugin.ship.get({
				pluginId: input.pluginId,
				shipId: ship.name,
			});
			return { shipId: ship.name };
		}),
	delete: t.procedure
		.input(z.object({ pluginId: z.string(), shipId: z.string() }))
		.send(async ({ ctx, input }) => {
			inputAuth(ctx);
			const plugin = getPlugin(ctx, input.pluginId);
			const ship = plugin.aspects.ships.find((ship) => ship.name === input.shipId);
			if (!ship) return;
			plugin.aspects.ships.splice(plugin.aspects.ships.indexOf(ship), 1);

			await ship?.remove();
			pubsub.publish.plugin.ship.all({ pluginId: input.pluginId });
		}),
	update: t.procedure
		.input(
			z.object({
				pluginId: z.string(),
				shipId: z.string(),
				name: z.string().optional(),
				category: shipCategories.optional(),
				description: z.string().optional(),
				tags: z.string().array().optional(),
				mass: z.number().optional(),
				length: z.number().optional(),
				logo: z.instanceof(File).optional(),
				model: z.instanceof(File).optional(),
				top: z.instanceof(Blob).optional(),
				side: z.instanceof(Blob).optional(),
				vanity: z.instanceof(Blob).optional(),
				theme: z.object({ themeId: z.string(), pluginId: z.string() }).optional(),
				cargoContainers: z.number().optional(),
				cargoContainerVolume: z.number().optional(),
			}),
		)
		.send(async ({ ctx, input }) => {
			inputAuth(ctx);
			const plugin = getPlugin(ctx, input.pluginId);
			if (!input.shipId) throw new Error("Ship ID is required");
			const ship = plugin.aspects.ships.find((ship) => ship.name === input.shipId);
			if (!ship) return { shipId: "" };
			if (input.category) ship.category = input.category;
			if (input.description) ship.description = input.description;
			if (input.tags) ship.tags = input.tags;
			if (input.mass) {
				if (Number.isNaN(input.mass) || input.mass <= 0) {
					throw new Error("Mass must be a number greater than 0");
				}
				ship.mass = input.mass;
			}
			if (input.length) {
				if (Number.isNaN(input.length) || input.length <= 0) {
					throw new Error("Length must be a number greater than 0");
				}
				ship.length = input.length;
			}

			if (typeof input.logo !== "undefined") {
				const ext = path.extname(typeof input.logo === "string" ? input.logo : input.logo.name);
				ship.assets.logo = await ctx.uploadFile.call(ship, input.logo, `logo${ext}`);
			}
			if (typeof input.model !== "undefined")
				ship.assets.model = await ctx.uploadFile.call(ship, input.model, "model.glb");
			if (typeof input.top !== "undefined")
				ship.assets.topView = await ctx.uploadFile.call(ship, input.top, "top.png");
			if (typeof input.side !== "undefined")
				ship.assets.sideView = await ctx.uploadFile.call(ship, input.side, "side.png");
			if (typeof input.vanity !== "undefined")
				ship.assets.vanity = await ctx.uploadFile.call(ship, input.vanity, "vanity.png");

			if (input.theme) {
				const themePlugin = getPlugin(ctx, input.theme.pluginId);
				const theme = themePlugin.aspects.themes.find(
					(theme) => theme.name === input.theme?.themeId,
				);
				if (!theme) throw new Error("Theme not found");
				ship.theme = input.theme;
			}

			if (typeof input.cargoContainers === "number") {
				if (Number.isNaN(input.cargoContainers) || input.cargoContainers <= 0) {
					throw new Error("Cargo Containers must be a number greater than 0");
				}
				ship.cargoContainers = input.cargoContainers;
			}
			if (typeof input.cargoContainerVolume === "number") {
				if (Number.isNaN(input.cargoContainerVolume) || input.cargoContainerVolume <= 0) {
					throw new Error("Cargo Container Volume must be a number greater than 0");
				}
				ship.cargoContainerVolume = input.cargoContainerVolume;
			}

			if (input.name !== ship.name && input.name) {
				await ship?.rename(input.name);
			}
			pubsub.publish.plugin.ship.all({ pluginId: input.pluginId });
			pubsub.publish.plugin.ship.get({
				pluginId: input.pluginId,
				shipId: ship.name,
			});
			return { shipId: ship.name };
		}),
	addSystem: t.procedure
		.input(
			z.object({
				pluginId: z.string(),
				shipId: z.string(),
				systemId: z.string(),
				systemPlugin: z.string(),
			}),
		)
		.send(({ ctx, input }) => {
			const plugin = getPlugin(ctx, input.pluginId);
			if (!input.shipId) throw new Error("Ship ID is required");
			const ship = plugin.aspects.ships.find((ship) => ship.name === input.shipId);
			if (!ship) return { shipId: "" };

			const systemPlugin = getPlugin(ctx, input.systemPlugin);
			const system = systemPlugin.aspects.shipSystems.find(
				(system) => system.name === input.systemId,
			);
			if (!system) return ship;
			const id = uniqid("ssys-");
			ship.shipSystems.push({
				id,
				systemId: input.systemId,
				pluginId: input.systemPlugin,
			});

			pubsub.publish.plugin.ship.all({ pluginId: input.pluginId });
			pubsub.publish.plugin.ship.get({
				pluginId: input.pluginId,
				shipId: ship.name,
			});

			return ship;
		}),
	toggleSystem: t.procedure
		.input(
			z.object({
				pluginId: z.string(),
				shipId: z.string(),
				systemId: z.string(),
				systemPlugin: z.string(),
			}),
		)
		.send(({ ctx, input }) => {
			inputAuth(ctx);
			const plugin = getPlugin(ctx, input.pluginId);
			if (!input.shipId) throw new Error("Ship ID is required");
			const ship = plugin.aspects.ships.find((ship) => ship.name === input.shipId);
			if (!ship) return { shipId: "" };

			const existingSystem = ship.shipSystems.findIndex(
				(system) =>
					system.id === input.systemId ||
					(system.systemId === input.systemId && system.pluginId === input.systemPlugin),
			);

			if (existingSystem > -1) {
				ship.shipSystems.splice(existingSystem, 1);
			} else {
				const systemPlugin = getPlugin(ctx, input.systemPlugin);
				const system = systemPlugin.aspects.shipSystems.find(
					(system) => system.name === input.systemId,
				);
				if (!system) return ship;
				const id = uniqid("ssys-");
				ship.shipSystems.push({
					id,
					systemId: input.systemId,
					pluginId: input.systemPlugin,
				});
			}

			pubsub.publish.plugin.ship.all({ pluginId: input.pluginId });
			pubsub.publish.plugin.ship.get({
				pluginId: input.pluginId,
				shipId: ship.name,
			});

			return ship;
		}),
});
