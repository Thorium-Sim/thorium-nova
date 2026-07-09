import { MacroPlugin } from "@thorium/.server/classes/Plugins/Macro";
import { pubsub } from "@thorium/.server/init/pubsub";
import { t } from "@thorium/.server/init/t";
import {
	timelineBlockDefaults,
	timelineBlockTypes,
} from "@thorium/components/timelineBuilder/TimelineBlockTypes";
import inputAuth from "@thorium/utils/.server/inputAuth";
import { moveArrayItem } from "@thorium/utils/operations/moveArrayItem";
import uniqid from "@thorium/utils/uniqid";
import z from "zod";

import { getPlugin } from "./utils";

const block = t.router({
	add: t.procedure
		.input(
			z.object({
				pluginId: z.string(),
				macroId: z.string(),
				blockType: z.enum(timelineBlockTypes),
				init: z.any().optional(),
			}),
		)
		.send(({ ctx, input }) => {
			inputAuth(ctx);
			const plugin = getPlugin(ctx, input.pluginId);
			if (!input.macroId) throw new Error("Macro ID is required");
			const macro = plugin.aspects.macros.find((macro) => macro.name === input.macroId);
			if (!macro) throw new Error("Macro not found");
			const id = uniqid("blo-");
			const blockDefault = timelineBlockDefaults[input.blockType] as any;
			if (!macro.blocks) macro.blocks = [];
			macro.blocks.push({
				...blockDefault,
				...input.init,
				id,
				type: input.blockType,
			});
			pubsub.publish.plugin.macro.get({
				pluginId: input.pluginId,
				macroId: macro.name,
			});
			return { actionId: id };
		}),
	reorder: t.procedure
		.input(
			z.object({
				pluginId: z.string(),
				macroId: z.string(),
				blockId: z.string(),
				newIndex: z.number(),
			}),
		)
		.send(({ ctx, input }) => {
			const plugin = getPlugin(ctx, input.pluginId);
			if (!input.macroId) throw new Error("Macro ID is required");
			const macro = plugin.aspects.macros.find((macro) => macro.name === input.macroId);
			if (!macro) throw new Error("Macro not found");
			const blockIndex = macro.blocks.findIndex((action) => action.id === input.blockId);
			moveArrayItem(macro.blocks, blockIndex, input.newIndex);
			pubsub.publish.plugin.macro.get({
				pluginId: input.pluginId,
				macroId: macro.name,
			});
			return { actionId: input.blockId };
		}),
	delete: t.procedure
		.input(
			z.object({
				pluginId: z.string(),
				macroId: z.string(),
				blockId: z.string(),
			}),
		)
		.send(({ ctx, input }) => {
			const plugin = getPlugin(ctx, input.pluginId);
			if (!input.macroId) throw new Error("Macro ID is required");
			const macro = plugin.aspects.macros.find((macro) => macro.name === input.macroId);
			if (!macro) throw new Error("Macro not found");
			const blockIndex = macro.blocks.findIndex((action) => action.id === input.blockId);
			macro.blocks.splice(blockIndex, 1);
			pubsub.publish.plugin.macro.get({
				pluginId: input.pluginId,
				macroId: macro.name,
			});
			return { actionId: input.blockId };
		}),
	update: t.procedure
		.input(
			z.object({
				pluginId: z.string(),
				macroId: z.string(),
				blockId: z.string(),
				name: z.string().optional(),
				properties: z.record(z.any()).optional(),
			}),
		)
		.send(({ ctx, input }) => {
			inputAuth(ctx);
			const plugin = getPlugin(ctx, input.pluginId);
			const macro = plugin.aspects.macros.find((macro) => macro.name === input.macroId);
			if (!macro) throw new Error("Macro not found");
			const block = macro.blocks.find((action) => action.id === input.blockId);
			if (!block) throw new Error("Block not found");
			Object.assign(block, input.properties);
			pubsub.publish.plugin.macro.get({
				pluginId: input.pluginId,
				macroId: macro.name,
			});
			return { actionId: block.id };
		}),
	replace: t.procedure
		.input(
			z.object({
				pluginId: z.string(),
				macroId: z.string(),
				blockId: z.string(),
				blocks: z.any(),
			}),
		)
		.send(({ ctx, input }) => {
			inputAuth(ctx);
			const plugin = getPlugin(ctx, input.pluginId);
			const macro = plugin.aspects.macros.find((macro) => macro.name === input.macroId);
			if (!macro) throw new Error("Macro not found");
			const block = macro.blocks.findIndex((action) => action.id === input.blockId);
			if (block === -1) throw new Error("Block not found");
			macro.blocks.splice(block, 1, ...input.blocks);
			pubsub.publish.plugin.macro.get({
				pluginId: input.pluginId,
				macroId: macro.name,
			});
			return {};
		}),
});

export const macro = t.router({
	all: t.procedure
		.input(
			z.object({
				pluginId: z.string().optional(),
				type: z.enum(["macro", "trigger"]),
			}),
		)
		.filter((publish: { pluginId: string } | null, { input }) => {
			if (!publish || publish.pluginId === input?.pluginId) return true;
			return false;
		})
		.request(({ ctx, input }) => {
			if (input?.pluginId) {
				const plugin = getPlugin(ctx, input.pluginId);
				return plugin.aspects.macros.filter((t) => t.type === input.type);
			}
			return ctx.server.plugins.reduce((prev: MacroPlugin[], next) => {
				return prev.concat(next.aspects.macros.filter((t) => t.type === input.type));
			}, []);
		}),
	get: t.procedure
		.input(z.object({ pluginId: z.string(), macroId: z.string() }))
		.filter((publish: { pluginId: string; macroId: string } | null, { input }) => {
			if (!publish || publish.pluginId === input.pluginId) return true;
			return false;
		})
		.request(({ ctx, input }) => {
			const plugin = getPlugin(ctx, input.pluginId);
			const macro = plugin.aspects.macros.find((macro) => macro.name === input.macroId);
			if (!macro) throw null;
			return macro;
		}),
	create: t.procedure
		.input(
			z.object({
				pluginId: z.string(),
				name: z.string(),
				type: z.enum(["macro", "trigger"]),
			}),
		)
		.send(async ({ ctx, input }) => {
			inputAuth(ctx);
			const plugin = getPlugin(ctx, input.pluginId);
			const macro = await MacroPlugin.create({ name: input.name, type: input.type }, plugin);
			plugin.aspects.macros.push(macro);

			pubsub.publish.plugin.macro.all({ pluginId: input.pluginId });
			pubsub.publish.plugin.macro.get({
				pluginId: input.pluginId,
				macroId: macro.name,
			});
			return { macroId: macro.name };
		}),
	delete: t.procedure
		.input(z.object({ pluginId: z.string(), macroId: z.string() }))
		.send(async ({ ctx, input }) => {
			inputAuth(ctx);
			const plugin = getPlugin(ctx, input.pluginId);
			const macro = plugin.aspects.macros.find((macro) => macro.name === input.macroId);
			if (!macro) return;
			plugin.aspects.macros.splice(plugin.aspects.macros.indexOf(macro), 1);

			await macro?.remove();
			pubsub.publish.plugin.macro.all({ pluginId: input.pluginId });
		}),

	update: t.procedure
		.input(
			z.object({
				pluginId: z.string(),
				macroId: z.string(),
				name: z.string().optional(),
				category: z.string().optional(),
				description: z.string().optional(),
				active: z.boolean().optional(),
			}),
		)
		.send(async ({ ctx, input }) => {
			inputAuth(ctx);
			const plugin = getPlugin(ctx, input.pluginId);
			if (!input.macroId) throw new Error("Macro ID is required");
			const macro = plugin.aspects.macros.find((macro) => macro.name === input.macroId);
			if (!macro) return { macroId: "" };
			if (input.category) macro.category = input.category;
			if (input.description) macro.description = input.description;
			if (typeof input.active === "boolean") macro.active = input.active;

			if (input.name !== macro.name && input.name) {
				await macro?.rename(input.name);
			}
			pubsub.publish.plugin.macro.all({ pluginId: input.pluginId });
			pubsub.publish.plugin.macro.get({
				pluginId: input.pluginId,
				macroId: macro.name,
			});
			return { macroId: macro.name };
		}),
	block,
});
