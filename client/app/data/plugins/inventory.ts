import InventoryPlugin from "@server/classes/Plugins/Inventory";
import { t } from "@server/init/t";
import { pubsub } from "@server/init/pubsub";
import inputAuth from "@server/utils/inputAuth";
import { z } from "zod";
import { getPlugin } from "./utils";
import path from "node:path";
import fs from "node:fs/promises";
import { thoriumPath } from "@server/utils/appPaths";

export const inventory = t.router({
	all: t.procedure
		.input(z.object({ pluginId: z.string() }))
		.filter((publish: { pluginId: string } | null, { input }) => {
			if (publish && input.pluginId !== publish.pluginId) return false;
			return true;
		})
		.request(({ ctx, input }) => {
			const plugin = getPlugin(ctx, input.pluginId);
			return plugin.aspects.inventory.map(({ name, description }) => ({
				name,
				description,
			}));
		}),
	get: t.procedure
		.input(z.object({ pluginId: z.string(), inventoryId: z.string() }))
		.filter(
			(
				publish: { pluginId: string; inventoryId: string } | null,
				{ input },
			) => {
				if (publish && input.pluginId !== publish.pluginId) return false;
				return true;
			},
		)
		.request(({ ctx, input }) => {
			const plugin = getPlugin(ctx, input.pluginId);
			const inventory = plugin.aspects.inventory.find(
				(inventory) => inventory.name === input.inventoryId,
			);
			if (!inventory) return null;
			return {
				name: inventory.name,
				plural: inventory.plural,
				description: inventory.description,
				tags: inventory.tags,
				volume: inventory.volume,
				durability: inventory.durability,
				continuous: inventory.continuous,
				flags: inventory.flags,
				assets: inventory.assets,
			};
		}),
	create: t.procedure
		.input(z.object({ pluginId: z.string(), name: z.string() }))
		.send(({ ctx, input }) => {
			inputAuth(ctx);
			const plugin = getPlugin(ctx, input.pluginId);
			const inventory = new InventoryPlugin({ name: input.name }, plugin);
			plugin.aspects.inventory.push(inventory);

			pubsub.publish.plugin.inventory.all({ pluginId: input.pluginId });
			return { inventoryId: inventory.name };
		}),
	delete: t.procedure
		.input(z.object({ pluginId: z.string(), inventoryId: z.string() }))
		.send(async ({ ctx, input }) => {
			inputAuth(ctx);
			const plugin = getPlugin(ctx, input.pluginId);
			const inventory = plugin.aspects.inventory.find(
				(inventory) => inventory.name === input.inventoryId,
			);
			if (!inventory) return;
			plugin.aspects.inventory.splice(
				plugin.aspects.inventory.indexOf(inventory),
				1,
			);

			await inventory?.removeFile();
			pubsub.publish.plugin.inventory.all({ pluginId: input.pluginId });
			pubsub.publish.plugin.inventory.get({
				pluginId: input.pluginId,
				inventoryId: inventory.name,
			});
		}),
	update: t.procedure
		.input(
			z.object({
				pluginId: z.string(),
				inventoryId: z.string(),
				name: z.string().optional(),
				description: z.string().optional(),
				tags: z.string().array().optional(),
				plural: z.string().optional(),
				volume: z.number().optional(),
				durability: z.number().optional(),
				continuous: z.boolean().optional(),
				flags: z.any().optional(),
				image: z.union([z.string(), z.instanceof(File)]).optional(),
			}),
		)
		.send(async ({ ctx, input }) => {
			inputAuth(ctx);
			const plugin = getPlugin(ctx, input.pluginId);
			if (!input.inventoryId) throw new Error("Inventory ID is required");
			const inventory = plugin.aspects.inventory.find(
				(inventory) => inventory.name === input.inventoryId,
			);
			if (!inventory) return { inventoryId: "" };
			if (typeof input.description === "string")
				inventory.description = input.description;
			if (input.tags) inventory.tags = input.tags;
			if (typeof input.volume === "number") inventory.volume = input.volume;
			if (typeof input.continuous === "boolean")
				inventory.continuous = input.continuous;
			if (input.flags) inventory.flags = input.flags;
			if (typeof input.plural === "string") inventory.plural = input.plural;
			if (typeof input.durability === "number")
				inventory.durability = input.durability;
			if (input.name !== inventory.name && input.name) {
				await inventory?.rename(input.name);
			}
			await fs.mkdir(path.join(thoriumPath, inventory.assetPath), {
				recursive: true,
			});
			if (typeof input.image === "string") {
				const ext = path.extname(input.image);
				await moveFile(input.image, `image${ext}`, "image");
			}

			if (input.name !== inventory.name && input.name) {
				await inventory?.rename(input.name);
			}
			pubsub.publish.plugin.inventory.all({ pluginId: input.pluginId });
			pubsub.publish.plugin.inventory.get({
				pluginId: input.pluginId,
				inventoryId: inventory.name,
			});
			return { inventoryId: inventory.name };

			async function moveFile(
				file: Blob | File | string,
				filePath: string,
				propertyName: "image",
			) {
				if (!inventory) return;
				if (typeof file === "string") {
					await fs.mkdir(path.join(thoriumPath, inventory.assetPath), {
						recursive: true,
					});
					await fs.rename(
						file,
						path.join(thoriumPath, inventory.assetPath, filePath),
					);
					inventory.assets[propertyName] = path.join(
						inventory.assetPath,
						filePath,
					);
				}
			}
		}),
});
