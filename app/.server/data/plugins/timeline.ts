import MissionPlugin from "@thorium/.server/classes/Plugins/Mission";
import { t } from "@thorium/.server/init/t";
import { z } from "zod";
import { getPlugin } from "./utils";
import inputAuth from "@thorium/utils/.server/inputAuth";
import { pubsub } from "@thorium/.server/init/pubsub";
import { moveArrayItem } from "@thorium/utils/operations/moveArrayItem";
import uniqid from "@thorium/utils/uniqid";
import path from "node:path";
import {
	timelineBlockDefaults,
	timelineBlockTypes,
	type TimelineBlock,
} from "@thorium/components/timelineBuilder/TimelineBlockTypes";
import ReportPlugin from "@thorium/.server/classes/Plugins/Report";
import type { FlightStartingPoint } from "@thorium/.server/spawners/flight";
import TrainingPlugin from "@thorium/.server/classes/Plugins/Training";
import type { Aspect } from "@thorium/.server/classes/Plugins/Aspect";
import ConversationPlugin from "@thorium/.server/classes/Plugins/Conversation";

const timelineType = z.enum(["missions", "reports", "trainings"]);
const timelineClasses: Record<z.infer<typeof timelineType>, any> = {
	missions: MissionPlugin,
	reports: ReportPlugin,
	trainings: TrainingPlugin,
};

const block = t.router({
	add: t.procedure
		.input(
			z.object({
				pluginId: z.string(),
				timelineId: z.string(),
				stepId: z.string(),
				blockType: z.enum(timelineBlockTypes),
				init: z.any().optional(),
				timelineType,
			}),
		)
		.send(({ ctx, input }) => {
			inputAuth(ctx);
			const plugin = getPlugin(ctx, input.pluginId);
			if (!input.timelineId) throw new Error("Timeline ID is required");
			const timeline = plugin.aspects[input.timelineType].find(
				(timeline) => timeline.name === input.timelineId,
			);
			if (!timeline) throw new Error("Timeline not found");
			if (!input.stepId) throw new Error("Step ID is required");
			const step = timeline.steps.find((step) => step.id === input.stepId);
			if (!step) throw new Error("Step not found");
			const id = uniqid("blo-");
			const blockDefault = timelineBlockDefaults[input.blockType] as any;
			if (!step.blocks) step.blocks = [];
			step.blocks.push({
				...blockDefault,
				...input.init,
				id,
				type: input.blockType,
			});
			pubsub.publish.plugin.timeline.get({
				pluginId: input.pluginId,
				timelineId: timeline.name,
			});
			return { actionId: id };
		}),
	reorder: t.procedure
		.input(
			z.object({
				pluginId: z.string(),
				timelineId: z.string(),
				timelineType,
				stepId: z.string(),
				blockId: z.string(),
				newIndex: z.number(),
			}),
		)
		.send(({ ctx, input }) => {
			const plugin = getPlugin(ctx, input.pluginId);
			if (!input.timelineId) throw new Error("Timeline ID is required");
			const timeline = plugin.aspects[input.timelineType].find(
				(timeline) => timeline.name === input.timelineId,
			);
			if (!timeline) throw new Error("Timeline not found");
			if (!input.stepId) throw new Error("Step ID is required");
			const step = timeline.steps.find((step) => step.id === input.stepId);
			if (!step) throw new Error("Step not found");
			const blockIndex = step.blocks.findIndex(
				(action) => action.id === input.blockId,
			);
			moveArrayItem(step.blocks, blockIndex, input.newIndex);
			pubsub.publish.plugin.timeline.get({
				pluginId: input.pluginId,
				timelineId: timeline.name,
			});
			return { actionId: input.blockId };
		}),
	delete: t.procedure
		.input(
			z.object({
				pluginId: z.string(),
				timelineId: z.string(),
				timelineType,
				stepId: z.string(),
				blockId: z.string(),
			}),
		)
		.send(({ ctx, input }) => {
			const plugin = getPlugin(ctx, input.pluginId);
			if (!input.timelineId) throw new Error("Timeline ID is required");
			const timeline = plugin.aspects[input.timelineType].find(
				(timeline) => timeline.name === input.timelineId,
			);
			if (!timeline) throw new Error("Timeline not found");
			if (!input.stepId) throw new Error("Step ID is required");
			const step = timeline.steps.find((step) => step.id === input.stepId);
			if (!step) throw new Error("Step not found");
			const blockIndex = step.blocks.findIndex(
				(action) => action.id === input.blockId,
			);
			step.blocks.splice(blockIndex, 1);
			pubsub.publish.plugin.timeline.get({
				pluginId: input.pluginId,
				timelineId: timeline.name,
			});
			return { actionId: input.blockId };
		}),
	update: t.procedure
		.input(
			z.object({
				pluginId: z.string(),
				timelineId: z.string(),
				timelineType,
				stepId: z.string(),
				blockId: z.string(),
				name: z.string().optional(),
				properties: z.record(z.any()).optional(),
			}),
		)
		.send(({ ctx, input }) => {
			inputAuth(ctx);
			const plugin = getPlugin(ctx, input.pluginId);
			const timeline = plugin.aspects[input.timelineType].find(
				(timeline) => timeline.name === input.timelineId,
			);
			if (!timeline) throw new Error("Timeline not found");
			const step = timeline.steps.find((step) => step.id === input.stepId);
			if (!step) throw new Error("Step not found");
			const block = step.blocks.find((action) => action.id === input.blockId);
			if (!block) throw new Error("Block not found");
			Object.assign(block, input.properties);
			pubsub.publish.plugin.timeline.get({
				pluginId: input.pluginId,
				timelineId: timeline.name,
			});
			return { actionId: block.id };
		}),
	replace: t.procedure
		.input(
			z.object({
				pluginId: z.string(),
				timelineId: z.string(),
				timelineType,
				stepId: z.string(),
				blockId: z.string(),
				blocks: z.any(),
			}),
		)
		.send(({ ctx, input }) => {
			inputAuth(ctx);
			const plugin = getPlugin(ctx, input.pluginId);
			const timeline = plugin.aspects[input.timelineType].find(
				(timeline) => timeline.name === input.timelineId,
			);
			if (!timeline) throw new Error("Timeline not found");
			const step = timeline.steps.find((step) => step.id === input.stepId);
			if (!step) throw new Error("Step not found");
			const blockIndex = step.blocks.findIndex(
				(action) => action.id === input.blockId,
			);
			if (blockIndex === -1) throw new Error("Block not found");
			const replacedBlock = step.blocks[blockIndex];
			if (replacedBlock.type === "Macro") {
				const slotBlocks = replacedBlock.triggerBlocks;
				replaceSlotBlocks(input.blocks, slotBlocks);
			}
			// traverse the incoming blocks to put the slot block in.
			step.blocks.splice(blockIndex, 1, ...input.blocks);
			pubsub.publish.plugin.timeline.get({
				pluginId: input.pluginId,
				timelineId: timeline.name,
			});
			return {};
		}),
});

function replaceSlotBlocks(
	inputBlocks: TimelineBlock[],
	slotBlocks: TimelineBlock[],
): void {
	for (let i = 0; i < inputBlocks.length; i++) {
		const block = inputBlocks[i];
		if (block.type === "MacroSlot") {
			inputBlocks.splice(i, 1, ...slotBlocks);
			return;
		}
		if ("triggerBlocks" in block) {
			replaceSlotBlocks(block.triggerBlocks, slotBlocks);
		}
	}
}

const prerequisiteBlock = t.router({
	add: t.procedure
		.input(
			z.object({
				pluginId: z.string(),
				timelineId: z.string(),
				timelineType,
				blockType: z.enum(timelineBlockTypes),
				init: z.any().optional(),
			}),
		)
		.send(({ ctx, input }) => {
			inputAuth(ctx);
			const plugin = getPlugin(ctx, input.pluginId);
			if (!input.timelineId) throw new Error("Timeline ID is required");
			const timeline = plugin.aspects[input.timelineType].find(
				(timeline) => timeline.name === input.timelineId,
			);
			if (!timeline) throw new Error("Timeline not found");
			const id = uniqid("blo-");
			const blockDefault = timelineBlockDefaults[input.blockType] as any;
			timeline.prerequisiteBlocks.push({
				...blockDefault,
				...input.init,
				id,
				type: input.blockType,
			});
			pubsub.publish.plugin.timeline.get({
				pluginId: input.pluginId,
				timelineId: timeline.name,
			});
			return { actionId: id };
		}),
	reorder: t.procedure
		.input(
			z.object({
				pluginId: z.string(),
				timelineId: z.string(),
				timelineType,
				blockId: z.string(),
				newIndex: z.number(),
			}),
		)
		.send(({ ctx, input }) => {
			const plugin = getPlugin(ctx, input.pluginId);
			if (!input.timelineId) throw new Error("Timeline ID is required");
			const timeline = plugin.aspects[input.timelineType].find(
				(timeline) => timeline.name === input.timelineId,
			);
			if (!timeline) throw new Error("Timeline not found");
			const blockIndex = timeline.prerequisiteBlocks.findIndex(
				(action) => action.id === input.blockId,
			);
			moveArrayItem(timeline.prerequisiteBlocks, blockIndex, input.newIndex);
			pubsub.publish.plugin.timeline.get({
				pluginId: input.pluginId,
				timelineId: timeline.name,
			});
			return { actionId: input.blockId };
		}),
	delete: t.procedure
		.input(
			z.object({
				pluginId: z.string(),
				timelineId: z.string(),
				timelineType,
				blockId: z.string(),
			}),
		)
		.send(({ ctx, input }) => {
			const plugin = getPlugin(ctx, input.pluginId);
			if (!input.timelineId) throw new Error("Timeline ID is required");
			const timeline = plugin.aspects[input.timelineType].find(
				(timeline) => timeline.name === input.timelineId,
			);
			if (!timeline) throw new Error("Timeline not found");
			const blockIndex = timeline.prerequisiteBlocks.findIndex(
				(action) => action.id === input.blockId,
			);
			timeline.prerequisiteBlocks.splice(blockIndex, 1);
			pubsub.publish.plugin.timeline.get({
				pluginId: input.pluginId,
				timelineId: timeline.name,
			});
			return { actionId: input.blockId };
		}),
	update: t.procedure
		.input(
			z.object({
				pluginId: z.string(),
				timelineId: z.string(),
				timelineType,
				blockId: z.string(),
				name: z.string().optional(),
				properties: z.record(z.any()).optional(),
			}),
		)
		.send(({ ctx, input }) => {
			inputAuth(ctx);
			const plugin = getPlugin(ctx, input.pluginId);
			const timeline = plugin.aspects[input.timelineType].find(
				(timeline) => timeline.name === input.timelineId,
			);
			if (!timeline) throw new Error("Timeline not found");
			const block = timeline.prerequisiteBlocks.find(
				(action) => action.id === input.blockId,
			);
			if (!block) throw new Error("Block not found");
			Object.assign(block, input.properties);
			pubsub.publish.plugin.timeline.get({
				pluginId: input.pluginId,
				timelineId: timeline.name,
			});
			return { actionId: block.id };
		}),
	replace: t.procedure
		.input(
			z.object({
				pluginId: z.string(),
				timelineId: z.string(),
				timelineType,
				blockId: z.string(),
				blocks: z.any(),
			}),
		)
		.send(({ ctx, input }) => {
			inputAuth(ctx);
			const plugin = getPlugin(ctx, input.pluginId);
			const timeline = plugin.aspects[input.timelineType].find(
				(timeline) => timeline.name === input.timelineId,
			);
			if (!timeline) throw new Error("Timeline not found");
			const blockIndex = timeline.prerequisiteBlocks.findIndex(
				(action) => action.id === input.blockId,
			);
			if (blockIndex === -1) throw new Error("Block not found");
			timeline.prerequisiteBlocks.splice(blockIndex, 1, ...input.blocks);
			pubsub.publish.plugin.timeline.get({
				pluginId: input.pluginId,
				timelineId: timeline.name,
			});
			return {};
		}),
});

const step = t.router({
	add: t.procedure
		.input(
			z.object({
				pluginId: z.string(),
				timelineId: z.string(),
				timelineType,
				name: z.string(),
			}),
		)
		.send(({ ctx, input }) => {
			inputAuth(ctx);
			const plugin = getPlugin(ctx, input.pluginId);
			if (!input.timelineId) throw new Error("Timeline ID is required");
			const timeline = plugin.aspects[input.timelineType].find(
				(timeline) => timeline.name === input.timelineId,
			);
			if (!timeline) throw new Error("Timeline not found");
			const stepId = timeline.addStep(input.name, [
				{
					id: uniqid("blo-"),
					type: "Action",
					action: "client.setTraining",
					values: { clientId: "$clientId" },
				},
			]);
			pubsub.publish.plugin.timeline.get({
				pluginId: input.pluginId,
				timelineId: timeline.name,
			});

			return { timelineId: timeline.name, stepId };
		}),
	insert: t.procedure
		.input(
			z.object({
				pluginId: z.string(),
				timelineId: z.string(),
				timelineType,
				name: z.string(),
				stepId: z.string(),
			}),
		)
		.send(({ ctx, input }) => {
			inputAuth(ctx);
			const plugin = getPlugin(ctx, input.pluginId);
			if (!input.timelineId) throw new Error("Timeline ID is required");
			const timeline = plugin.aspects[input.timelineType].find(
				(timeline) => timeline.name === input.timelineId,
			);
			if (!timeline) throw new Error("Timeline not found");
			const stepId = timeline.insertStep(input.name, input.stepId);
			pubsub.publish.plugin.timeline.get({
				pluginId: input.pluginId,
				timelineId: timeline.name,
			});

			return { timelineId: timeline.name, stepId };
		}),
	duplicate: t.procedure
		.input(
			z.object({
				pluginId: z.string(),
				timelineId: z.string(),
				timelineType,
				stepId: z.string(),
			}),
		)
		.send(({ ctx, input }) => {
			inputAuth(ctx);
			const plugin = getPlugin(ctx, input.pluginId);
			if (!input.timelineId) throw new Error("Timeline ID is required");
			const timeline = plugin.aspects[input.timelineType].find(
				(timeline) => timeline.name === input.timelineId,
			);
			if (!timeline) throw new Error("Timeline not found");
			const stepId = timeline.duplicateStep(input.stepId);
			pubsub.publish.plugin.timeline.get({
				pluginId: input.pluginId,
				timelineId: timeline.name,
			});

			return { timelineId: timeline.name, stepId };
		}),
	delete: t.procedure
		.input(
			z.object({
				pluginId: z.string(),
				timelineId: z.string(),
				timelineType,
				stepId: z.string(),
			}),
		)
		.send(({ ctx, input }) => {
			inputAuth(ctx);
			const plugin = getPlugin(ctx, input.pluginId);
			if (!input.timelineId) throw new Error("Timeline ID is required");
			const timeline = plugin.aspects[input.timelineType].find(
				(timeline) => timeline.name === input.timelineId,
			);
			if (!timeline) throw new Error("Timeline not found");
			const stepIndex = timeline.steps.findIndex(
				(step) => step.id === input.stepId,
			);
			timeline.removeStep(input.stepId);
			let alternateStep: number | null = stepIndex;
			if (!timeline.steps[alternateStep]) alternateStep = stepIndex - 1;
			if (!timeline.steps[alternateStep]) alternateStep = stepIndex + 1;
			pubsub.publish.plugin.timeline.get({
				pluginId: input.pluginId,
				timelineId: timeline.name,
			});
			return { alternateStep: timeline.steps[alternateStep]?.id || null };
		}),
	reorder: t.procedure
		.input(
			z.object({
				pluginId: z.string(),
				timelineId: z.string(),
				timelineType,
				stepId: z.string(),
				newIndex: z.number(),
			}),
		)
		.send(({ ctx, input }) => {
			const plugin = getPlugin(ctx, input.pluginId);
			if (!input.timelineId) throw new Error("Timeline ID is required");
			const timeline = plugin.aspects[input.timelineType].find(
				(timeline) => timeline.name === input.timelineId,
			);
			if (!timeline) throw new Error("Timeline not found");
			const stepIndex = timeline.steps.findIndex(
				(step) => step.id === input.stepId,
			);
			moveArrayItem(timeline.steps, stepIndex, input.newIndex);
			pubsub.publish.plugin.timeline.get({
				pluginId: input.pluginId,
				timelineId: timeline.name,
			});
			return { stepId: input.stepId };
		}),
	update: t.procedure
		.input(
			z.object({
				pluginId: z.string(),
				timelineId: z.string(),
				timelineType,
				stepId: z.string(),
				name: z.string().optional(),
				description: z.string().optional(),
				tags: z.array(z.string()).optional(),
			}),
		)
		.send(({ ctx, input }) => {
			inputAuth(ctx);
			const plugin = getPlugin(ctx, input.pluginId);
			if (!input.timelineId) throw new Error("Timeline ID is required");
			const timeline = plugin.aspects[input.timelineType].find(
				(timeline) => timeline.name === input.timelineId,
			);
			if (!timeline) throw new Error("Timeline not found");
			if (!input.stepId) throw new Error("Step ID is required");
			const step = timeline.steps.find((step) => step.id === input.stepId);
			if (!step) throw new Error("Step not found");
			if (input.name) step.name = input.name;
			if (input.description) step.description = input.description;
			if (input.tags) step.tags = input.tags;
			pubsub.publish.plugin.timeline.get({
				pluginId: input.pluginId,
				timelineId: timeline.name,
			});
			return { stepId: step.id };
		}),
	block,
});

const conversations = t.router({
	list: t.procedure
		.input(z.object({ pluginId: z.string(), timelineId: z.string() }))
		.filter(
			(
				publish: { pluginId: string; timelineId?: string } | null,
				{ input },
			) => {
				if (
					!publish ||
					(publish.pluginId === input.pluginId &&
						publish.timelineId === input.timelineId)
				)
					return true;
				return false;
			},
		)
		.request(({ ctx, input }) => {
			const plugin = getPlugin(ctx, input.pluginId);
			return plugin.aspects.conversations.filter(
				(c) => c.timelineId === input.timelineId,
			);
		}),
	get: t.procedure
		.input(z.object({ pluginId: z.string(), conversationId: z.string() }))
		.filter(
			(
				publish: { pluginId: string; conversationId: string } | null,
				{ input },
			) => {
				if (
					!publish ||
					(publish.pluginId === input.pluginId &&
						publish.conversationId === input.conversationId)
				)
					return true;
				return false;
			},
		)
		.request(async ({ ctx, input }) => {
			const plugin = getPlugin(ctx, input.pluginId);
			const conversation = plugin.aspects.conversations.find(
				(conversation) => conversation.name === input.conversationId,
			);
			if (!conversation) throw null;
			const assetPath = await conversation.getAssetUrl();
			// TODO March 19, 2026 - Replace this with the default conversation template
			let text = "";
			try {
				text = await ctx.readFile.call(
					conversation,
					path.join(assetPath, conversation.assets.conversation),
				);
			} catch {}
			return { ...conversation, text };
		}),
	create: t.procedure
		.input(
			z.object({
				pluginId: z.string(),
				timelineId: z.string(),
				name: z.string(),
			}),
		)
		.send(({ ctx, input }) => {
			inputAuth(ctx);
			const plugin = getPlugin(ctx, input.pluginId);
			const conversation = new ConversationPlugin(
				{ name: input.name, timelineId: input.timelineId },
				plugin,
			);
			plugin.aspects.conversations.push(conversation);
			const name = conversation.name;

			pubsub.publish.plugin.timeline.conversations.list({
				timelineId: input.timelineId,
				pluginId: input.pluginId,
			});
			pubsub.publish.plugin.timeline.conversations.get({
				pluginId: input.pluginId,
				conversationId: name,
			});
			return { conversationId: name };
		}),
	delete: t.procedure
		.input(z.object({ pluginId: z.string(), conversationId: z.string() }))
		.send(async ({ ctx, input }) => {
			inputAuth(ctx);
			const plugin = getPlugin(ctx, input.pluginId);
			const conversation = plugin.aspects.conversations.find(
				(conversation) => conversation.name === input.conversationId,
			) as any;
			if (!conversation) return;
			plugin.aspects.conversations.splice(
				plugin.aspects.conversations.indexOf(conversation),
				1,
			);

			await conversation?.remove();
			pubsub.publish.plugin.timeline.conversations.list({
				pluginId: input.pluginId,
				timelineId: conversation.timelineId,
			});
		}),
	update: t.procedure
		.input(
			z.intersection(
				z.object({ pluginId: z.string(), conversationId: z.string() }),
				z.union([
					z.object({ name: z.string() }),
					z.object({ text: z.string() }),
				]),
			),
		)
		.send(async ({ ctx, input }) => {
			inputAuth(ctx);
			const plugin = getPlugin(ctx, input.pluginId);
			const conversation = plugin.aspects.conversations.find(
				(conversation) => conversation.name === input.conversationId,
			);
			if (!conversation) throw new Error("Theme not found.");
			if ("text" in input) {
				conversation.assets.conversation = await ctx.uploadFile.call(
					conversation,
					new Blob([input.text], { type: "text/css" }),
					"conversation.ink",
				);
			}
			if ("name" in input) {
				await conversation.rename(input.name);
			}
			pubsub.publish.plugin.timeline.conversations.list({
				timelineId: conversation.timelineId,
				pluginId: input.pluginId,
			});
			pubsub.publish.plugin.timeline.conversations.get({
				pluginId: input.pluginId,
				conversationId: conversation.name,
			});
			return {
				conversationId: conversation.name,
				...("text" in input ? { text: input.text } : {}),
			};
		}),
	duplicate: t.procedure
		.input(
			z.object({
				pluginId: z.string(),
				conversationId: z.string(),
				name: z.string(),
			}),
		)
		.send(async ({ ctx, input }) => {
			inputAuth(ctx);
			const plugin = getPlugin(ctx, input.pluginId);
			const conversation = plugin.aspects.conversations.find(
				(conversation) => conversation.name === input.conversationId,
			);
			if (!conversation) throw new Error("Conversation not found.");
			const conversationCopy = await conversation.duplicate(input.name);
			pubsub.publish.plugin.timeline.conversations.list({
				timelineId: conversation.timelineId,
				pluginId: input.pluginId,
			});
			return { conversationId: conversationCopy.name };
		}),
	uploadFile: t.procedure
		.input(
			z.object({
				pluginId: z.string(),
				conversationId: z.string(),
				file: z.instanceof(File),
				fileName: z.string(),
			}),
		)
		.send(async ({ ctx, input }) => {
			inputAuth(ctx);
			const plugin = getPlugin(ctx, input.pluginId);
			const conversation = plugin.aspects.conversations.find(
				(conversation) => conversation.name === input.conversationId,
			);
			if (!conversation) throw new Error("Conversation not found.");

			conversation.assets.files.push(
				await ctx.uploadFile.call(conversation, input.file, input.fileName),
			);

			pubsub.publish.plugin.timeline.conversations.list({
				timelineId: conversation.timelineId,
				pluginId: input.pluginId,
			});
			pubsub.publish.plugin.timeline.conversations.get({
				pluginId: input.pluginId,
				conversationId: conversation.name,
			});
			return { conversationId: conversation.name };
		}),
	removeFile: t.procedure
		.input(
			z.object({
				pluginId: z.string(),
				conversationId: z.string(),
				file: z.string(),
			}),
		)
		.send(async ({ ctx, input }) => {
			inputAuth(ctx);
			const plugin = getPlugin(ctx, input.pluginId);
			const conversation = plugin.aspects.conversations.find(
				(conversation) => conversation.name === input.conversationId,
			);
			if (!conversation) throw new Error("Conversation not found.");
			if (typeof input.file !== "string") throw new Error("Invalid file.");
			await conversation.removeAsset(input.file);

			pubsub.publish.plugin.timeline.conversations.list({
				timelineId: conversation.timelineId,
				pluginId: input.pluginId,
			});
			pubsub.publish.plugin.timeline.conversations.get({
				pluginId: input.pluginId,
				conversationId: conversation.name,
			});
			return { conversationId: conversation.name };
		}),
});

export const timeline = t.router({
	all: t.procedure
		.input(z.object({ pluginId: z.string(), timelineType }))
		.filter((publish: { pluginId: string } | null, { input }) => {
			if (!publish || publish.pluginId === input.pluginId) return true;
			return false;
		})
		.request(({ ctx, input }) => {
			const plugin = getPlugin(ctx, input.pluginId);
			return plugin.aspects[input.timelineType];
		}),
	get: t.procedure
		.input(
			z.object({ pluginId: z.string(), timelineId: z.string(), timelineType }),
		)
		.filter(
			(publish: { pluginId: string; timelineId: string } | null, { input }) => {
				if (!publish || publish.pluginId === input.pluginId) return true;
				return false;
			},
		)
		.request(({ ctx, input }) => {
			const plugin = getPlugin(ctx, input.pluginId);
			const timeline = plugin.aspects[input.timelineType].find(
				(timeline) => timeline.name === input.timelineId,
			);
			if (!timeline) throw null;
			return timeline;
		}),
	create: t.procedure
		.input(
			z.object({
				pluginId: z.string(),
				name: z.string(),
				timelineType,
			}),
		)
		.send(({ ctx, input }) => {
			inputAuth(ctx);
			const plugin = getPlugin(ctx, input.pluginId);
			let name = input.name;
			const timeline = new timelineClasses[input.timelineType](
				{ name: input.name },
				plugin,
			);
			plugin.aspects[input.timelineType].push(timeline);
			name = timeline.name;

			pubsub.publish.plugin.timeline.all({ pluginId: input.pluginId });
			pubsub.publish.plugin.timeline.get({
				pluginId: input.pluginId,
				timelineId: name,
			});
			return { timelineId: name };
		}),
	delete: t.procedure
		.input(
			z.object({ pluginId: z.string(), timelineId: z.string(), timelineType }),
		)
		.send(async ({ ctx, input }) => {
			inputAuth(ctx);
			const plugin = getPlugin(ctx, input.pluginId);
			const timeline = plugin.aspects[input.timelineType].find(
				(timeline) => timeline.name === input.timelineId,
			) as any;
			if (!timeline) return;
			plugin.aspects[input.timelineType].splice(
				plugin.aspects[input.timelineType].indexOf(timeline),
				1,
			);

			await timeline?.remove();
			pubsub.publish.plugin.timeline.all({ pluginId: input.pluginId });
		}),

	update: t.procedure
		.input(
			z.object({
				pluginId: z.string(),
				timelineId: z.string(),
				timelineType,
				name: z.string().optional(),
				category: z.string().optional(),
				tags: z.array(z.string()).optional(),
				description: z.string().optional(),
				cover: z.instanceof(File).optional(),
				autoApplyWhenCompleted: z.boolean().optional(),
			}),
		)
		.send(async ({ ctx, input }) => {
			inputAuth(ctx);
			const plugin = getPlugin(ctx, input.pluginId);
			if (!input.timelineId) throw new Error("Timeline ID is required");
			const timeline = plugin.aspects[input.timelineType].find(
				(timeline) => timeline.name === input.timelineId,
			);
			if (!timeline) return { timelineId: "" };
			if (input.category) timeline.category = input.category;
			if (input.description) timeline.description = input.description;
			if (input.tags) timeline.tags = input.tags;
			if (
				typeof input.autoApplyWhenCompleted !== "undefined" &&
				timeline.kind === "reports"
			)
				timeline.autoApplyWhenCompleted = input.autoApplyWhenCompleted;
			if (
				timeline instanceof MissionPlugin &&
				typeof input.cover === "string"
			) {
				const ext = path.extname(input.cover);
				timeline.assets.cover = await ctx.uploadFile.call(
					timeline,
					input.cover,
					`logo${ext}`,
				);
			}

			if (input.name !== timeline.name && input.name) {
				await timeline?.rename(input.name);
			}
			pubsub.publish.plugin.timeline.all({ pluginId: input.pluginId });
			pubsub.publish.plugin.timeline.get({
				pluginId: input.pluginId,
				timelineId: timeline.name,
			});
			return { timelineId: timeline.name };
		}),
	step,
	prerequisiteBlock,
	missions: t.procedure
		.input(z.object({ pluginId: z.string().optional() }).optional())
		.request(({ ctx, input }) => {
			return ctx.server.plugins.reduce(
				(
					acc: {
						name: string;
						description: string;
						category: string;
						cover: string;
						pluginId: string;
						flightMode: "nova" | "legacy";
					}[],
					plugin,
				) => {
					const missions = plugin.aspects.missions.map(
						({ name, description, category, assets, flightMode }) => ({
							name,
							description,
							category,
							cover: assets.cover,
							pluginId: plugin.id,
							flightMode,
						}),
					);
					if (input?.pluginId && plugin.name !== input?.pluginId) return acc;
					if (plugin.name === input?.pluginId) return acc.concat(missions);
					if (!plugin.active) return acc;
					return acc.concat(missions);
				},
				[],
			);
		}),
	startingPoints: t.procedure.request(({ ctx }) => {
		return ctx.server.plugins.reduce(
			(points: FlightStartingPoint[], plugin) => {
				if (!plugin.active) return points;

				return points.concat(
					plugin.aspects.solarSystems.flatMap((solarSystem) => {
						const planets = solarSystem.planets.map((planet) => ({
							pluginId: plugin.id,
							solarSystemId: solarSystem.name,
							objectId: planet.name,
							type: "planet" as const,
						}));
						// TODO May 17, 2022 - Make permanent ships available as starting points.
						return planets;
					}),
				);
			},
			[],
		);
	}),
	conversations,
});
