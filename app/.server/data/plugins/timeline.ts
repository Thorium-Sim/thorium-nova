import path from "node:path";

import type BasePlugin from "@thorium/.server/classes/Plugins";
import ConversationPlugin from "@thorium/.server/classes/Plugins/Conversation";
import MissionPlugin from "@thorium/.server/classes/Plugins/Mission";
import ReportPlugin from "@thorium/.server/classes/Plugins/Report";
import TrainingPlugin from "@thorium/.server/classes/Plugins/Training";
import type { DataContext } from "@thorium/.server/DataContext";
import { pubsub } from "@thorium/.server/init/pubsub";
import { t } from "@thorium/.server/init/t";
import type { FlightStartingPoint } from "@thorium/.server/spawners/flight";
import {
	timelineBlockDefaults,
	timelineBlockTypes,
	type TimelineBlock,
} from "@thorium/components/timelineBuilder/TimelineBlockTypes";
import inputAuth from "@thorium/utils/.server/inputAuth";
import { Entity } from "@thorium/utils/ecs";
import { moveArrayItem } from "@thorium/utils/operations/moveArrayItem";
import uniqid from "@thorium/utils/uniqid";
import z from "zod";

import { getPlugin } from "./utils";

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
			syncTimelinePluginToFlightTimeline(ctx, timeline);
			pubsub.publish.plugin.timeline.get({
				pluginId: input.pluginId,
				timelineId: timeline.name,
			});
			pubsub.publish.plugin.timeline.all({ pluginId: input.pluginId });

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
			const blockIndex = step.blocks.findIndex((action) => action.id === input.blockId);
			moveArrayItem(step.blocks, blockIndex, input.newIndex);
			syncTimelinePluginToFlightTimeline(ctx, timeline);
			pubsub.publish.plugin.timeline.get({
				pluginId: input.pluginId,
				timelineId: timeline.name,
			});
			pubsub.publish.plugin.timeline.all({ pluginId: input.pluginId });

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
			const blockIndex = step.blocks.findIndex((action) => action.id === input.blockId);
			step.blocks.splice(blockIndex, 1);
			syncTimelinePluginToFlightTimeline(ctx, timeline);
			pubsub.publish.plugin.timeline.get({
				pluginId: input.pluginId,
				timelineId: timeline.name,
			});
			pubsub.publish.plugin.timeline.all({ pluginId: input.pluginId });

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
			syncTimelinePluginToFlightTimeline(ctx, timeline);
			pubsub.publish.plugin.timeline.get({
				pluginId: input.pluginId,
				timelineId: timeline.name,
			});
			pubsub.publish.plugin.timeline.all({ pluginId: input.pluginId });

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
			const blockIndex = step.blocks.findIndex((action) => action.id === input.blockId);
			if (blockIndex === -1) throw new Error("Block not found");
			const replacedBlock = step.blocks[blockIndex];
			if (replacedBlock.type === "Macro") {
				const slotBlocks = replacedBlock.triggerBlocks;
				replaceSlotBlocks(input.blocks, slotBlocks);
			}
			// traverse the incoming blocks to put the slot block in.
			step.blocks.splice(blockIndex, 1, ...input.blocks);
			syncTimelinePluginToFlightTimeline(ctx, timeline);
			pubsub.publish.plugin.timeline.get({
				pluginId: input.pluginId,
				timelineId: timeline.name,
			});
			pubsub.publish.plugin.timeline.all({ pluginId: input.pluginId });

			return {};
		}),
});

function replaceSlotBlocks(inputBlocks: TimelineBlock[], slotBlocks: TimelineBlock[]): void {
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
			pubsub.publish.plugin.timeline.all({ pluginId: input.pluginId });

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
			pubsub.publish.plugin.timeline.all({ pluginId: input.pluginId });

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
			pubsub.publish.plugin.timeline.all({ pluginId: input.pluginId });

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
			const block = timeline.prerequisiteBlocks.find((action) => action.id === input.blockId);
			if (!block) throw new Error("Block not found");
			Object.assign(block, input.properties);
			pubsub.publish.plugin.timeline.get({
				pluginId: input.pluginId,
				timelineId: timeline.name,
			});
			pubsub.publish.plugin.timeline.all({ pluginId: input.pluginId });

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
			pubsub.publish.plugin.timeline.all({ pluginId: input.pluginId });

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
			syncTimelinePluginToFlightTimeline(ctx, timeline);
			pubsub.publish.plugin.timeline.get({
				pluginId: input.pluginId,
				timelineId: timeline.name,
			});
			pubsub.publish.plugin.timeline.all({ pluginId: input.pluginId });

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
			syncTimelinePluginToFlightTimeline(ctx, timeline);
			pubsub.publish.plugin.timeline.get({
				pluginId: input.pluginId,
				timelineId: timeline.name,
			});
			pubsub.publish.plugin.timeline.all({ pluginId: input.pluginId });
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
			syncTimelinePluginToFlightTimeline(ctx, timeline);
			pubsub.publish.plugin.timeline.get({
				pluginId: input.pluginId,
				timelineId: timeline.name,
			});
			pubsub.publish.plugin.timeline.all({ pluginId: input.pluginId });
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
			const stepIndex = timeline.steps.findIndex((step) => step.id === input.stepId);
			timeline.removeStep(input.stepId);
			let alternateStep: number | null = stepIndex;
			if (!timeline.steps[alternateStep]) alternateStep = stepIndex - 1;
			if (!timeline.steps[alternateStep]) alternateStep = stepIndex + 1;
			syncTimelinePluginToFlightTimeline(ctx, timeline);
			pubsub.publish.plugin.timeline.get({
				pluginId: input.pluginId,
				timelineId: timeline.name,
			});
			pubsub.publish.plugin.timeline.all({ pluginId: input.pluginId });
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
			const stepIndex = timeline.steps.findIndex((step) => step.id === input.stepId);
			moveArrayItem(timeline.steps, stepIndex, input.newIndex);
			syncTimelinePluginToFlightTimeline(ctx, timeline);
			pubsub.publish.plugin.timeline.get({
				pluginId: input.pluginId,
				timelineId: timeline.name,
			});
			pubsub.publish.plugin.timeline.all({ pluginId: input.pluginId });
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
			syncTimelinePluginToFlightTimeline(ctx, timeline);
			pubsub.publish.plugin.timeline.get({
				pluginId: input.pluginId,
				timelineId: timeline.name,
			});
			pubsub.publish.plugin.timeline.all({ pluginId: input.pluginId });
			return { stepId: step.id };
		}),
	block,
});

const conversations = t.router({
	list: t.procedure
		.input(z.object({ pluginId: z.string(), timelineId: z.string() }))
		.filter((publish: { pluginId: string; timelineId?: string } | null, { input }) => {
			if (
				!publish ||
				(publish.pluginId === input.pluginId && publish.timelineId === input.timelineId)
			)
				return true;
			return false;
		})
		.request(({ ctx, input }) => {
			const plugin = getPlugin(ctx, input.pluginId);
			return plugin.aspects.conversations.filter((c) => c.timelineId === input.timelineId);
		}),
	get: t.procedure
		.input(z.object({ pluginId: z.string(), conversationId: z.string() }))
		.filter((publish: { pluginId: string; conversationId: string } | null, { input }) => {
			if (
				!publish ||
				(publish.pluginId === input.pluginId && publish.conversationId === input.conversationId)
			)
				return true;
			return false;
		})
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
		.send(async ({ ctx, input }) => {
			inputAuth(ctx);
			const plugin = getPlugin(ctx, input.pluginId);
			const conversation = await ConversationPlugin.create(
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
			plugin.aspects.conversations.splice(plugin.aspects.conversations.indexOf(conversation), 1);

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
				z.union([z.object({ name: z.string() }), z.object({ text: z.string() })]),
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
		.input(
			z
				.object({ pluginId: z.string().optional(), timelineType: timelineType.optional() })
				.optional(),
		)
		.filter((publish: { pluginId: string } | null, { input }) => {
			if (!publish || !input?.pluginId || publish.pluginId === input.pluginId) return true;
			return false;
		})
		.request(({ ctx, input }) => {
			const pluginId = input?.pluginId;
			const timelineType = input?.timelineType;
			const timelines = [];
			const plugins: BasePlugin[] = [];
			if (pluginId) {
				plugins.push(getPlugin(ctx, pluginId));
			} else {
				for (const plugin of ctx.server.plugins) {
					if (plugin.active) plugins.push(plugin);
				}
			}

			for (const plugin of plugins) {
				if (timelineType) {
					timelines.push(...plugin.aspects[timelineType]);
				} else {
					timelines.push(...plugin.aspects.missions);
					timelines.push(...plugin.aspects.trainings);
					timelines.push(...plugin.aspects.reports);
				}
			}

			return timelines.map((t) => ({ ...t, pluginName: t.plugin.name }));
		}),
	get: t.procedure
		.input(z.object({ pluginId: z.string(), timelineId: z.string(), timelineType }))
		.filter((publish: { pluginId: string; timelineId: string } | null, { input }) => {
			if (!publish || publish.pluginId === input.pluginId) return true;
			return false;
		})
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
		.send(async ({ ctx, input }) => {
			inputAuth(ctx);
			const plugin = getPlugin(ctx, input.pluginId);
			let name = input.name;
			const timeline = await timelineClasses[input.timelineType].create(
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
		.input(z.object({ pluginId: z.string(), timelineId: z.string(), timelineType }))
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
			if (typeof input.autoApplyWhenCompleted !== "undefined" && timeline.kind === "reports")
				timeline.autoApplyWhenCompleted = input.autoApplyWhenCompleted;
			if (timeline instanceof MissionPlugin && typeof input.cover === "string") {
				const ext = path.extname(input.cover);
				timeline.assets.cover = await ctx.uploadFile.call(timeline, input.cover, `logo${ext}`);
			}

			if (input.name !== timeline.name && input.name) {
				await timeline?.rename(input.name);
			}

			syncTimelinePluginToFlightTimeline(ctx, timeline);

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
		return ctx.server.plugins.reduce((points: FlightStartingPoint[], plugin) => {
			if (!plugin.active) return points;

			return points.concat(
				plugin.aspects.solarSystems.flatMap((solarSystem) => {
					const planets = solarSystem.planets.flatMap((planet) => [
						...(planet.keyLocation
							? [
									{
										pluginId: plugin.id,
										solarSystemId: solarSystem.name,
										objectId: planet.name,
										type: "planet" as const,
									},
								]
							: []),
						...(planet.satellites?.flatMap((s) =>
							s.keyLocation
								? {
										pluginId: plugin.id,
										solarSystemId: solarSystem.name,
										objectId: s.name,
										type: "planet" as const,
									}
								: [],
						) || []),
					]);
					// TODO May 17, 2022 - Make permanent ships available as starting points.
					return planets;
				}),
			);
		}, []);
	}),
	conversations,
});

export function syncTimelinePluginToFlightTimeline(
	ctx: DataContext,
	timeline: MissionPlugin | ReportPlugin | TrainingPlugin,
) {
	// First find the flight timeline
	let flightTimeline: Entity | undefined = undefined;
	if (!ctx.flight) return;

	for (const entity of ctx.ecs?.componentCache.get("isTimeline") || []) {
		if (
			entity.components.isTimeline?.pluginName === timeline.pluginName &&
			entity.components.identity?.name === timeline.name
		) {
			flightTimeline = entity;
			break;
		}
	}

	if (!flightTimeline?.components.isTimeline) return;

	// Get the current timeline step so we can properly adjust if steps were rearranged
	const currentStep = flightTimeline.components.isTimeline.currentStep;
	const currentStepEntityId = flightTimeline.components.isTimeline.steps[currentStep];

	// Make a little index of steps
	const stepIndex = new Map<string, Entity>();
	for (const entity of ctx.ecs.componentCache.get("isTimelineStep") || []) {
		if (
			!entity.components.isTimelineStep?.timelineStepId ||
			entity.components.isTimelineStep.timelineId !== flightTimeline.id
		)
			continue;
		stepIndex.set(entity.components.isTimelineStep.timelineStepId, entity);
	}

	// Update all of the timeline step entities
	// We will leave zombie timeline steps if one was deleted
	for (let i = 0; i < timeline.steps.length; i++) {
		const stepItem = timeline.steps[i];
		let stepEntity = stepIndex.get(stepItem.id);

		if (!stepEntity) {
			// It's a new step! Let's create the entity.
			stepEntity = new Entity();
			stepIndex.set(stepItem.id, stepEntity);
			ctx.ecs.addEntity(stepEntity);
		}
		// Update the step
		stepEntity.updateComponent("identity", {
			name: stepItem.name,
			description: stepItem.description,
		});
		stepEntity.updateComponent("tags", { tags: stepItem.tags });
		stepEntity.updateComponent("isTimelineStep", {
			blocks: JSON.parse(JSON.stringify(stepItem.blocks || [])),
			timelineId: flightTimeline.id,
			timelineStepId: stepItem.id,
		});
	}

	// Update the step ID list
	const steps = timeline.steps.flatMap((s) => stepIndex.get(s.id)?.id || []);
	const newCurrentStep = steps.indexOf(currentStepEntityId || -1) || currentStep;
	flightTimeline.updateComponent("isTimeline", { steps, currentStep: newCurrentStep });
}
