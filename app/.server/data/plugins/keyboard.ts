import { KeyboardPlugin } from "@thorium/.server/classes/Plugins/Keyboard";
import type { DataContext } from "@thorium/.server/DataContext";
import { pubsub } from "@thorium/.server/init/pubsub";
import { t } from "@thorium/.server/init/t";
import {
	timelineBlockDefaults,
	timelineBlockTypes,
} from "@thorium/components/timelineBuilder/TimelineBlockTypes";
import inputAuth from "@thorium/utils/.server/inputAuth";
import { getMetaFromBitmask } from "@thorium/utils/keyboardMetaBitmask";
import { moveArrayItem } from "@thorium/utils/operations/moveArrayItem";
import uniqid from "@thorium/utils/uniqid";
import z from "zod";

import { getPlugin } from "./utils";

function getKey(ctx: DataContext, input: { pluginId: string; keyboardId: string; keyId: string }) {
	const plugin = getPlugin(ctx, input.pluginId);
	if (!input.keyboardId) throw new Error("Keyboard ID is required");
	const keyboard = plugin.aspects.keyboards.find((keyboard) => keyboard.name === input.keyboardId);
	if (!keyboard) throw new Error("Keyboard not found");
	let key = keyboard.keys.find((k) => k.id === input.keyId);
	// Lets create a new key
	if (!key) {
		const [keyCode, bitmask] = input.keyId.split("-");
		const meta = getMetaFromBitmask(Number(bitmask));
		key = {
			id: input.keyId,
			keyCode,
			meta,
			downBlocks: [],
			upBlocks: [],
		};
		keyboard.keys.push(key);
	}
	return { keyboard, key };
}
const block = t.router({
	add: t.procedure
		.input(
			z.object({
				pluginId: z.string(),
				keyboardId: z.string(),
				keyId: z.string(),
				pressType: z.enum(["downBlocks", "upBlocks"]),
				blockType: z.enum(timelineBlockTypes),
				init: z.any().optional(),
			}),
		)
		.send(({ ctx, input }) => {
			inputAuth(ctx);
			const { keyboard, key } = getKey(ctx, input);
			const id = uniqid("blo-");
			const blockDefault = timelineBlockDefaults[input.blockType] as any;
			if (!key[input.pressType]) key[input.pressType] = [];
			key[input.pressType].push({
				...blockDefault,
				...input.init,
				id,
				type: input.blockType,
			});
			pubsub.publish.plugin.keyboard.get({
				pluginId: input.pluginId,
				keyboardId: keyboard.name,
			});
			return { actionId: id };
		}),
	reorder: t.procedure
		.input(
			z.object({
				pluginId: z.string(),
				keyboardId: z.string(),
				keyId: z.string(),
				pressType: z.enum(["downBlocks", "upBlocks"]),
				blockId: z.string(),
				newIndex: z.number(),
			}),
		)
		.send(({ ctx, input }) => {
			const { key, keyboard } = getKey(ctx, input);
			const blockIndex = key[input.pressType].findIndex((action) => action.id === input.blockId);
			moveArrayItem(key[input.pressType], blockIndex, input.newIndex);
			pubsub.publish.plugin.keyboard.get({
				pluginId: input.pluginId,
				keyboardId: keyboard.name,
			});
			return { actionId: input.blockId };
		}),
	delete: t.procedure
		.input(
			z.object({
				pluginId: z.string(),
				keyboardId: z.string(),
				keyId: z.string(),
				pressType: z.enum(["downBlocks", "upBlocks"]),
				blockId: z.string(),
			}),
		)
		.send(({ ctx, input }) => {
			const { key, keyboard } = getKey(ctx, input);
			const blockIndex = key[input.pressType].findIndex((action) => action.id === input.blockId);
			key[input.pressType].splice(blockIndex, 1);
			pubsub.publish.plugin.keyboard.get({
				pluginId: input.pluginId,
				keyboardId: keyboard.name,
			});
			return { actionId: input.blockId };
		}),
	update: t.procedure
		.input(
			z.object({
				pluginId: z.string(),
				keyboardId: z.string(),
				keyId: z.string(),
				pressType: z.enum(["downBlocks", "upBlocks"]),
				blockId: z.string(),
				name: z.string().optional(),
				properties: z.record(z.any()).optional(),
			}),
		)
		.send(({ ctx, input }) => {
			inputAuth(ctx);
			const { key, keyboard } = getKey(ctx, input);

			const block = key[input.pressType].find((action) => action.id === input.blockId);
			if (!block) throw new Error("Block not found");
			Object.assign(block, input.properties);
			pubsub.publish.plugin.keyboard.get({
				pluginId: input.pluginId,
				keyboardId: keyboard.name,
			});
			return { actionId: block.id };
		}),
	replace: t.procedure
		.input(
			z.object({
				pluginId: z.string(),
				keyboardId: z.string(),
				keyId: z.string(),
				pressType: z.enum(["downBlocks", "upBlocks"]),
				blockId: z.string(),
				blocks: z.any(),
			}),
		)
		.send(({ ctx, input }) => {
			inputAuth(ctx);
			const { key, keyboard } = getKey(ctx, input);

			const block = key[input.pressType].findIndex((action) => action.id === input.blockId);
			if (block === -1) throw new Error("Block not found");
			key[input.pressType].splice(block, 1, ...input.blocks);
			pubsub.publish.plugin.keyboard.get({
				pluginId: input.pluginId,
				keyboardId: keyboard.name,
			});
			return {};
		}),
});

export const keyboard = t.router({
	all: t.procedure
		.input(
			z.object({
				pluginId: z.string().optional(),
			}),
		)
		.filter((publish: { pluginId: string } | null, { input }) => {
			if (!publish || publish.pluginId === input?.pluginId) return true;
			return false;
		})
		.request(({ ctx, input }) => {
			if (input?.pluginId) {
				const plugin = getPlugin(ctx, input.pluginId);
				return plugin.aspects.keyboards.map((k) => ({ pluginName: k.pluginName, ...k.toJSON() }));
			}
			return ctx.server.plugins
				.reduce((prev: KeyboardPlugin[], next) => {
					return prev.concat(next.aspects.keyboards);
				}, [])
				.map((m) => ({ pluginName: m.pluginName, ...m.toJSON() }));
		}),
	get: t.procedure
		.input(z.object({ pluginId: z.string(), keyboardId: z.string() }))
		.filter((publish: { pluginId: string; keyboardId: string } | null, { input }) => {
			if (!publish || publish.pluginId === input.pluginId) return true;
			return false;
		})
		.request(({ ctx, input }) => {
			const plugin = getPlugin(ctx, input.pluginId);
			const keyboard = plugin.aspects.keyboards.find(
				(keyboard) => keyboard.name === input.keyboardId,
			);
			if (!keyboard) throw null;
			return keyboard.toJSON();
		}),
	create: t.procedure
		.input(
			z.object({
				pluginId: z.string(),
				name: z.string(),
			}),
		)
		.send(async ({ ctx, input }) => {
			inputAuth(ctx);
			const plugin = getPlugin(ctx, input.pluginId);
			const keyboard = await KeyboardPlugin.create({ name: input.name }, plugin);
			plugin.aspects.keyboards.push(keyboard);

			pubsub.publish.plugin.keyboard.all({ pluginId: input.pluginId });
			pubsub.publish.plugin.keyboard.get({
				pluginId: input.pluginId,
				keyboardId: keyboard.name,
			});
			return { keyboardId: keyboard.name };
		}),
	delete: t.procedure
		.input(z.object({ pluginId: z.string(), keyboardId: z.string() }))
		.send(async ({ ctx, input }) => {
			inputAuth(ctx);
			const plugin = getPlugin(ctx, input.pluginId);
			const keyboard = plugin.aspects.keyboards.find(
				(keyboard) => keyboard.name === input.keyboardId,
			);
			if (!keyboard) return;
			plugin.aspects.keyboards.splice(plugin.aspects.keyboards.indexOf(keyboard), 1);

			await keyboard?.remove();
			pubsub.publish.plugin.keyboard.all({ pluginId: input.pluginId });
		}),

	update: t.procedure
		.input(
			z.object({
				pluginId: z.string(),
				keyboardId: z.string(),
				name: z.string().optional(),
				category: z.string().optional(),
				description: z.string().optional(),
			}),
		)
		.send(async ({ ctx, input }) => {
			inputAuth(ctx);
			const plugin = getPlugin(ctx, input.pluginId);
			if (!input.keyboardId) throw new Error("Macro ID is required");
			const keyboard = plugin.aspects.keyboards.find(
				(keyboard) => keyboard.name === input.keyboardId,
			);
			if (!keyboard) return { keyboardId: "" };
			if (input.category) keyboard.category = input.category;
			if (input.description) keyboard.description = input.description;

			if (input.name !== keyboard.name && input.name) {
				await keyboard?.rename(input.name);
			}
			pubsub.publish.plugin.keyboard.all({ pluginId: input.pluginId });
			pubsub.publish.plugin.keyboard.get({
				pluginId: input.pluginId,
				keyboardId: keyboard.name,
			});
			return { keyboardId: keyboard.name };
		}),
	block,
});
