import { t } from "@thorium/.server/init/t";
import { spawnTimeline } from "@thorium/.server/spawners/timeline";
import type { Entity } from "@thorium/utils/ecs";
import { z } from "zod";
import { triggerStep } from "@thorium/utils/.server/evaluateEntityQuery";
import { applyDamageReportMetrics } from "@thorium/utils/.server/applyDamageReportMetrics";

export const timeline = t.router({
	activate: t.procedure
		.meta({ action: true })
		.input(z.object({ pluginId: z.string(), timelineId: z.string() }))
		.send(async ({ ctx, input }) => {
			if (!ctx.flight) return;
			const timeline =
				ctx.server.plugins
					.find((plugin) => plugin.id === input.pluginId)
					?.aspects.missions.find(
						(timeline) => timeline.name === input.timelineId,
					) ||
				ctx.server.plugins
					.find((plugin) => plugin.id === input.pluginId)
					?.aspects.reports.find(
						(timeline) => timeline.name === input.timelineId,
					);
			if (!timeline) return;
			const timelineEntity = spawnTimeline(timeline, (entity: Entity) => {
				ctx.flight?.ecs.addEntity(entity);
			});

			// Trigger the first step
			await triggerStep(
				ctx.flight.ecs.getEntityById(
					timelineEntity.components.isTimeline?.steps[0] || -1,
				)!,
			);
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
				const timelines = Array.from(
					ctx.flight?.ecs.componentCache.get("isTimeline") || [],
				);
				timeline = timelines?.find((timeline) =>
					timeline.components.isTimeline?.steps.includes(input.stepId!),
				);
			}

			if (!timeline) return;
			const stepIndex = timeline?.components.isTimeline?.currentStep;
			if (stepIndex === undefined) return;
			const steps = timeline.components.isTimeline?.steps;
			if (!steps) return;
			const nextStep = steps[stepIndex + 1];
			if (nextStep === undefined) {
				// The timeline is advancing beyond its final step, which indicates it is completed.
				timeline.updateComponent("isTimeline", { isComplete: true });

				// Report timelines might apply their damage metrics upon completion
				if (timeline.components.damageReport?.autoApplyWhenCompleted) {
					applyDamageReportMetrics(timeline);
				}
				return;
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
			// TODO: August 25, 2023 Send the necessary pubsub updates
		}),
	goToStep: t.procedure
		.meta({ action: true })
		.input(
			z.object({
				timelineId: z
					.number()
					.optional()
					.describe(
						"Leave blank to use the timeline associated with the step.",
					),
				stepId: z.number(),
			}),
		)
		.send(async ({ ctx, input }) => {
			let timeline: Entity | undefined | null;
			if (input.timelineId !== undefined) {
				timeline = ctx.flight?.ecs.getEntityById(input.timelineId);
			} else if (typeof input.stepId === "number") {
				const timelines = Array.from(
					ctx.flight?.ecs.componentCache.get("isTimeline") || [],
				);
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
		})
		.input(
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
			return;
		}),
});
