import { pubsub } from "@thorium/.server/init/pubsub";
import { t } from "@thorium/.server/init/t";
import { spawnTimeline } from "@thorium/.server/spawners/timeline";
import { applyDamageReportMetrics } from "@thorium/utils/.server/applyDamageReportMetrics";
import { triggerStep } from "@thorium/utils/.server/evaluateEntityQuery";
import type { Entity } from "@thorium/utils/ecs";
import z from "zod";

export const timeline = t.router({
	activate: t.procedure
		.meta({ action: true })
		.input(z.object({ pluginId: z.string(), timelineId: z.string() }))
		.output(z.object({ timelineId: z.number(), stepId: z.number().optional() }))
		.send(async ({ ctx, input }) => {
			if (!ctx.flight) throw new Error("Flight has not started.");
			const timeline =
				ctx.server.plugins
					.find((plugin) => plugin.id === input.pluginId)
					?.aspects.missions.find((timeline) => timeline.name === input.timelineId) ||
				ctx.server.plugins
					.find((plugin) => plugin.id === input.pluginId)
					?.aspects.reports.find((timeline) => timeline.name === input.timelineId) ||
				ctx.server.plugins
					.find((plugin) => plugin.id === input.pluginId)
					?.aspects.trainings.find((timeline) => timeline.name === input.timelineId);
			if (!timeline) throw new Error(`Timeline not found: ${input.pluginId} — ${input.timelineId}`);
			const timelineEntity = spawnTimeline(timeline, (entity: Entity) => {
				ctx.flight?.ecs.addEntity(entity);
			});
			const variables = { ...ctx.localVariables, timelineId: timelineEntity.id };
			timelineEntity.addComponent("variables", {
				variables: Object.entries(variables).map(([name, value]) => ({
					name,
					value,
					type: "any",
				})),
			});

			// Trigger the first step
			await triggerStep(
				ctx.flight.ecs.getEntityById(timelineEntity.components.isTimeline?.steps[0] || -1)!,
			);
			pubsub.publish.flight.timelines();
			return {
				timelineId: timelineEntity.id,
				stepId: timelineEntity.components.isTimeline?.steps[0],
			};
		}),
	advance: t.procedure
		.meta({
			action: () => {
				return {
					timelineId: {
						name: "Timeline ID",
						helper:
							"If using in a timeline action trigger, leave blank to advance the current timeline.",
					},
					stepId: {
						name: "Step ID",
						helper:
							"Advance to this step and activate immediately. Leave blank to advance to the next step in the timeline.",
					},
				};
			},
		})
		.input(
			z.object({
				timelineId: z.number().optional(),
				stepId: z.number().optional(),
			}),
		)
		.send(async ({ ctx, input }) => {
			let timeline: Entity | undefined | null;
			if (input.timelineId !== undefined) {
				timeline = ctx.flight?.ecs.getEntityById(input.timelineId);
			} else if (typeof input.stepId === "number") {
				const timelines = Array.from(ctx.flight?.ecs.componentCache.get("isTimeline") || []);
				timeline = timelines?.find((timeline) =>
					timeline.components.isTimeline?.steps.includes(input.stepId!),
				);
			}

			if (!timeline) return;
			const stepIndex = timeline?.components.isTimeline?.currentStep;
			if (stepIndex === undefined) return;
			const steps = timeline.components.isTimeline?.steps;
			if (!steps) return;
			const currentStep = steps[stepIndex];
			const nextStep = steps[stepIndex + 1];

			if (nextStep === undefined) {
				// The timeline is advancing beyond its final step, which indicates it is completed.
				await ctx.ecs.triggerAction("timeline.complete", { timelineId: timeline.id }, ctx);
				pubsub.publish.flight.timelines();
				return;
			} else {
				const step = ctx.ecs.getEntityById(currentStep);
				step?.updateComponent("isTimelineStep", { state: "executed" });
			}
			timeline.updateComponent("isTimeline", { currentStep: stepIndex + 1 });
			await triggerStep(ctx.flight!.ecs.getEntityById(steps[stepIndex + 1])!);
			// Deactivate all of the triggers associated with this timeline step
			for (const trigger of ctx.ecs.componentCache.get("isTrigger") || []) {
				if (
					trigger.components.isTrigger?.stepId === steps[stepIndex] &&
					!trigger.components.isTrigger.persist
				) {
					trigger.updateComponent("isTrigger", { active: false });
				}
			}
			pubsub.publish.flight.timelines();
			// TODO: August 25, 2023 Send the necessary pubsub updates
		}),
	goToStep: t.procedure
		.meta({ action: true })
		.input(
			z.object({
				timelineId: z
					.number()
					.optional()
					.describe("Leave blank to use the timeline associated with the step."),
				stepId: z.number(),
			}),
		)
		.send(async ({ ctx, input }) => {
			let timeline: Entity | undefined | null;
			if (input.timelineId !== undefined) {
				timeline = ctx.flight?.ecs.getEntityById(input.timelineId);
			} else if (typeof input.stepId === "number") {
				const timelines = Array.from(ctx.flight?.ecs.componentCache.get("isTimeline") || []);
				timeline = timelines?.find((timeline) =>
					timeline.components.isTimeline?.steps.includes(input.stepId!),
				);
			}
			if (!timeline) return;
			const steps = timeline.components.isTimeline?.steps;
			if (!steps) return;
			const stepIndex = steps.indexOf(input.stepId);
			if (typeof stepIndex !== "number" || stepIndex === -1) return;
			timeline.updateComponent("isTimeline", { currentStep: stepIndex });

			await triggerStep(ctx.flight!.ecs.getEntityById(steps[stepIndex])!);
			pubsub.publish.flight.timelines();
			// TODO: August 25, 2023 Send the necessary pubsub updates
		}),
	complete: t.procedure
		.meta({
			action: () => {
				return {
					timelineId: {
						name: "Timeline ID",
						helper:
							"If using in a timeline action trigger, leave blank to complete the current timeline.",
					},
				};
			},
			event: true,
		})
		.input(
			z.object({
				timelineId: z.number(),
			}),
		)
		.output(
			z.object({
				timelineId: z.number(),
			}),
		)
		.send(async ({ ctx, input }) => {
			const timeline = ctx.flight?.ecs.getEntityById(input.timelineId);
			if (!timeline) throw new Error("Timeline not found.");
			timeline.updateComponent("isTimeline", { isComplete: true });

			// Report timelines might apply their damage metrics upon completion
			if (timeline.components.damageReport?.autoApplyWhenCompleted) {
				applyDamageReportMetrics(timeline);
			}

			// Clear the training step for the client running this timeline
			if (timeline.components.isTimeline?.type === "training") {
				let clientId = "";
				for (const client of ctx.ecs.componentCache.get("flightClient") || []) {
					if (client.components.flightClient?.training?.timelineId === timeline.id) {
						client.updateComponent("flightClient", { training: null });
						clientId = client.components.flightClient.clientId;
					}
				}
				pubsub.publish.client.all();
				pubsub.publish.client.get({
					clientId,
				});
			}
			pubsub.publish.flight.timelines();
			return { timelineId: timeline.id };
		}),
});
