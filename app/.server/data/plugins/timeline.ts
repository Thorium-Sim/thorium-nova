import TimelinePlugin from "@thorium/.server/classes/Plugins/Timeline";
import { t } from "@thorium/.server/init/t";
import { z } from "zod";
import { getPlugin } from "./utils";
import inputAuth from "@thorium/utils/.server/inputAuth";
import { pubsub } from "@thorium/.server/init/pubsub";
import { moveArrayItem } from "@thorium/utils/operations/moveArrayItem";
import uniqid from "@thorium/utils/uniqid";
import type { FlightStartingPoint } from "@thorium/.server/data/flight";
import path from "node:path";
import {
	timelineBlockDefaults,
	timelineBlockTypes,
} from "@thorium/components/timelineBuilder/TimelineBlockTypes";

const block = t.router({
	add: t.procedure
		.input(
			z.object({
				pluginId: z.string(),
				timelineId: z.string(),
				stepId: z.string(),
				blockType: z.enum(timelineBlockTypes),
				init: z.any().optional(),
			}),
		)
		.send(({ ctx, input }) => {
			inputAuth(ctx);
			const plugin = getPlugin(ctx, input.pluginId);
			if (!input.timelineId) throw new Error("Timeline ID is required");
			const timeline = plugin.aspects.timelines.find(
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
				stepId: z.string(),
				blockId: z.string(),
				newIndex: z.number(),
			}),
		)
		.send(({ ctx, input }) => {
			const plugin = getPlugin(ctx, input.pluginId);
			if (!input.timelineId) throw new Error("Timeline ID is required");
			const timeline = plugin.aspects.timelines.find(
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
				stepId: z.string(),
				blockId: z.string(),
			}),
		)
		.send(({ ctx, input }) => {
			const plugin = getPlugin(ctx, input.pluginId);
			if (!input.timelineId) throw new Error("Timeline ID is required");
			const timeline = plugin.aspects.timelines.find(
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
				stepId: z.string(),
				blockId: z.string(),
				name: z.string().optional(),
				properties: z.record(z.any()).optional(),
			}),
		)
		.send(({ ctx, input }) => {
			inputAuth(ctx);
			const plugin = getPlugin(ctx, input.pluginId);
			const timeline = plugin.aspects.timelines.find(
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
				stepId: z.string(),
				blockId: z.string(),
				blocks: z.any(),
			}),
		)
		.send(({ ctx, input }) => {
			inputAuth(ctx);
			const plugin = getPlugin(ctx, input.pluginId);
			const timeline = plugin.aspects.timelines.find(
				(timeline) => timeline.name === input.timelineId,
			);
			if (!timeline) throw new Error("Timeline not found");
			const step = timeline.steps.find((step) => step.id === input.stepId);
			if (!step) throw new Error("Step not found");
			const blockIndex = step.blocks.findIndex(
				(action) => action.id === input.blockId,
			);
			if (blockIndex === -1) throw new Error("Block not found");
			step.blocks.splice(blockIndex, 1, ...input.blocks);
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
				name: z.string(),
			}),
		)
		.send(({ ctx, input }) => {
			inputAuth(ctx);
			const plugin = getPlugin(ctx, input.pluginId);
			if (!input.timelineId) throw new Error("Timeline ID is required");
			const timeline = plugin.aspects.timelines.find(
				(timeline) => timeline.name === input.timelineId,
			);
			if (!timeline) throw new Error("Timeline not found");
			const stepId = timeline.addStep(input.name);
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
				name: z.string(),
				stepId: z.string(),
			}),
		)
		.send(({ ctx, input }) => {
			inputAuth(ctx);
			const plugin = getPlugin(ctx, input.pluginId);
			if (!input.timelineId) throw new Error("Timeline ID is required");
			const timeline = plugin.aspects.timelines.find(
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
				stepId: z.string(),
			}),
		)
		.send(({ ctx, input }) => {
			inputAuth(ctx);
			const plugin = getPlugin(ctx, input.pluginId);
			if (!input.timelineId) throw new Error("Timeline ID is required");
			const timeline = plugin.aspects.timelines.find(
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
				stepId: z.string(),
			}),
		)
		.send(({ ctx, input }) => {
			inputAuth(ctx);
			const plugin = getPlugin(ctx, input.pluginId);
			if (!input.timelineId) throw new Error("Timeline ID is required");
			const timeline = plugin.aspects.timelines.find(
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
				stepId: z.string(),
				newIndex: z.number(),
			}),
		)
		.send(({ ctx, input }) => {
			const plugin = getPlugin(ctx, input.pluginId);
			if (!input.timelineId) throw new Error("Timeline ID is required");
			const timeline = plugin.aspects.timelines.find(
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
			const timeline = plugin.aspects.timelines.find(
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

export const timeline = t.router({
	all: t.procedure
		.input(z.object({ pluginId: z.string() }))
		.filter((publish: { pluginId: string } | null, { input }) => {
			if (!publish || publish.pluginId === input.pluginId) return true;
			return false;
		})
		.request(({ ctx, input }) => {
			const plugin = getPlugin(ctx, input.pluginId);
			return plugin.aspects.timelines;
		}),
	get: t.procedure
		.input(z.object({ pluginId: z.string(), timelineId: z.string() }))
		.filter(
			(publish: { pluginId: string; timelineId: string } | null, { input }) => {
				if (!publish || publish.pluginId === input.pluginId) return true;
				return false;
			},
		)
		.request(({ ctx, input }) => {
			const plugin = getPlugin(ctx, input.pluginId);
			const timeline = plugin.aspects.timelines.find(
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
				type: z.enum(["mission", "trigger", "training", "report"]),
			}),
		)
		.send(({ ctx, input }) => {
			inputAuth(ctx);
			const plugin = getPlugin(ctx, input.pluginId);
			const timeline = new TimelinePlugin(
				{ name: input.name, type: input.type },
				plugin,
			);
			plugin.aspects.timelines.push(timeline);

			pubsub.publish.plugin.timeline.all({ pluginId: input.pluginId });
			pubsub.publish.plugin.timeline.get({
				pluginId: input.pluginId,
				timelineId: timeline.name,
			});
			return { timelineId: timeline.name };
		}),
	delete: t.procedure
		.input(z.object({ pluginId: z.string(), timelineId: z.string() }))
		.send(async ({ ctx, input }) => {
			inputAuth(ctx);
			const plugin = getPlugin(ctx, input.pluginId);
			const timeline = plugin.aspects.timelines.find(
				(timeline) => timeline.name === input.timelineId,
			);
			if (!timeline) return;
			plugin.aspects.timelines.splice(
				plugin.aspects.timelines.indexOf(timeline),
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
				name: z.string().optional(),
				category: z.string().optional(),
				tags: z.array(z.string()).optional(),
				description: z.string().optional(),
				cover: z.instanceof(File).optional(),
			}),
		)
		.send(async ({ ctx, input }) => {
			inputAuth(ctx);
			const plugin = getPlugin(ctx, input.pluginId);
			if (!input.timelineId) throw new Error("Timeline ID is required");
			const timeline = plugin.aspects.timelines.find(
				(timeline) => timeline.name === input.timelineId,
			);
			if (!timeline) return { timelineId: "" };
			if (input.category) timeline.category = input.category;
			if (input.description) timeline.description = input.description;
			if (input.tags) timeline.tags = input.tags;
			if (typeof input.cover === "string") {
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
					}[],
					plugin,
				) => {
					const missions = plugin.aspects.timelines
						.filter((timeline) => timeline.type === "mission")
						.map(({ name, description, category, assets }) => ({
							name,
							description,
							category,
							cover: assets.cover,
							pluginId: plugin.id,
						}));
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
});
