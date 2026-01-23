import z from "zod";
import { t } from "@thorium/.server/init/t";
import {
	damageEffects,
	damageTypeValues,
	getAggregateDamage,
	getReportEffects,
} from "@thorium/utils/flags/damageTypes";
import { Entity } from "@thorium/utils/ecs";
import { pubsub } from "@thorium/.server/init/pubsub";
import type { ShipSystemTypes } from "@thorium/ecs-components/shipSystems";
import type ReportPlugin from "@thorium/.server/classes/Plugins/Report";
import { capitalCase } from "change-case";
import type { ReportVariables } from "@thorium/routes/config/reports/reportAvailableVariables";
import { selectAvailableTimelines } from "@thorium/utils/.server/executeBlocks";
import { spawnTimeline } from "@thorium/.server/spawners/timeline";
import { triggerStep } from "@thorium/utils/.server/evaluateEntityQuery";
import { applyDamageReportMetrics } from "@thorium/utils/.server/applyDamageReportMetrics";

export const damageReports = t.router({
	systems: t.procedure
		.input(z.object({ shipId: z.number() }))
		.filter((publish: { shipId: number }, { ctx, input }) => {
			if (publish && publish.shipId !== input.shipId) return false;
			return true;
		})
		.autoPublish([], () => null)
		.request(({ ctx, input }) => {
			const systems: {
				id: number;
				type: ShipSystemTypes;
				name: string;
				damage: number;
				onlineDamage: number;
				offlineDamage: number;
				offline: boolean;
			}[] = [];
			const ship = ctx.ecs.getEntityById(input.shipId);
			for (const systemId of ship?.components.shipSystems?.shipSystems.keys() ||
				[]) {
				const system = ctx.ecs.getEntityById(systemId);
				if (!system?.components.isShipSystem || !system.components.damage)
					continue;
				systems.push({
					id: systemId,
					type: system.components.isShipSystem.type,
					name: system.components.identity!.name,
					damage: getAggregateDamage(system),
					onlineDamage: system.components.damage!.onlineDamage,
					offlineDamage: system.components.damage!.offlineDamage,
					offline: system.components.damage!.offline,
				});
			}
			return systems;
		}),
	systemDiagnostic: t.procedure
		.input(z.object({ systemId: z.number() }))
		.filter((publish: { systemId: number }, { ctx, input }) => {
			if (publish && publish.systemId !== input.systemId) return false;
			return true;
		})
		.autoPublish([], () => null)
		.request(({ ctx, input }) => {
			const diagnostics = ctx.ecs.componentCache.get("diagnostic");
			for (const d of diagnostics || []) {
				if (d.components.diagnostic?.targetSystemId === input.systemId) {
					const diagnostic = d.components.diagnostic;
					return {
						id: d.id,
						level: diagnostic.level,
						results: diagnostic.results,
						progress: diagnostic.progress,
						reportCandidates: diagnostic.reportCandidates,
					};
				}
			}
			return null;
		}),
	diagnosticCreate: t.procedure
		.input(
			z.object({
				systemId: z.number(),
				level: z.enum(["1", "2", "3", "4"]),
			}),
		)
		.send(({ ctx, input }) => {
			const system = ctx.ecs.getEntityById(input.systemId);
			const ship = ctx.ecs.getEntityById(
				system?.components.isShipSystem?.shipId || -1,
			);
			if (!ship)
				throw new Error("Invalid system ID: System is not assigned to a ship");

			const diagnostic = new Entity();
			diagnostic.addComponent("identity", {
				name: `Level ${input.level} ${system?.components.identity || ""} Diagnostic`,
			});
			diagnostic.addComponent("diagnostic", {
				level: input.level,
				targetSystemId: input.systemId,
				shipId: ship.id,
				progress: 0,
			});
			ctx.ecs.addEntity(diagnostic);
			pubsub.publish.damageReports.systemDiagnostic({
				systemId: input.systemId,
			});
		}),
	diagnosticAbort: t.procedure
		.input(
			z.object({
				diagnosticId: z.number(),
			}),
		)
		.send(({ ctx, input }) => {
			const diagnostic = ctx.ecs.getEntityById(input.diagnosticId);
			if (!diagnostic) return;
			ctx.ecs.removeEntityById(input.diagnosticId);
			pubsub.publish.damageReports.systemDiagnostic({
				systemId: diagnostic.components.diagnostic?.targetSystemId || -1,
			});
		}),
	diagnosticReportCandidateCreate: t.procedure
		.input(
			z.object({
				diagnosticId: z.number(),
				damageMetric: z.enum(damageEffects),
			}),
		)
		.send(({ ctx, input }) => {
			const diagnostic = ctx.ecs.getEntityById(input.diagnosticId);
			if (!diagnostic) return;

			const reportCount =
				Number(diagnostic.components.diagnostic?.level || 1) - 1;
			if (reportCount <= 0) return;

			const system = ctx.ecs.getEntityById(
				diagnostic.components.diagnostic?.targetSystemId || -1,
			);
			if (!system) return;

			diagnostic.updateComponent("diagnostic", {
				reportCandidates: Array.from({ length: reportCount }).map(() => {
					const result = [];
					const report = getReportEffects(system, input.damageMetric);
					for (const [systemId, effects] of report.entries()) {
						const sys = ctx.ecs.getEntityById(systemId);
						if (!sys) continue;
						result.push({
							id: systemId,
							name: sys.components.identity?.name || "",
							effects,
						});
					}
					return {
						id: ctx.ecs.rng.nextString(),
						type: ctx.ecs.rng.nextFromList(damageTypeValues),
						primaryEffect: input.damageMetric,
						affectedSystems: result,
					};
				}),
			});

			pubsub.publish.damageReports.systemDiagnostic({
				systemId: diagnostic.components.diagnostic?.targetSystemId || -1,
			});
			return null;
		}),
	damageReports: t.procedure
		.input(z.object({ shipId: z.number() }))
		.filter((publish: { shipId: number }, { ctx, input }) => {
			if (publish && publish.shipId !== input.shipId) return false;
			return true;
		})
		.autoPublish(
			["damageReport"],
			(entity) =>
				entity.components.damageReport && {
					shipId: entity.components.damageReport.shipId,
				},
		)
		.request(({ ctx, input }) => {
			const reports: {
				id: number;
				systemId: number;
				name: string;
				stepCount: number;
				currentStepIndex: number;
				currentStepText: string;
			}[] = [];
			for (const report of ctx.ecs.componentCache.get("damageReport") || []) {
				const timeline = report.components.isTimeline;
				if (
					report.components.damageReport?.shipId !== input.shipId ||
					!timeline ||
					timeline.isComplete
				)
					continue;

				const currentStepIndex = timeline.currentStep;
				const currentTimelineStep = ctx.ecs.getEntityById(
					timeline.steps[currentStepIndex],
				);
				reports.push({
					id: report.id,
					systemId: report.components.damageReport.systemId,
					name: report.components.identity?.name || "Report",
					stepCount: timeline.steps.length,
					currentStepIndex,
					currentStepText:
						currentTimelineStep?.components.identity?.description || "",
				});
			}
			return reports;
		}),
	beginDamageReport: t.procedure
		.input(
			z.object({ diagnosticId: z.number(), reportCandidateId: z.string() }),
		)
		.send(async ({ ctx, input }) => {
			if (!ctx.flight) throw new Error("Flight is not started.");
			const diagnostic = ctx.ecs.getEntityById(input.diagnosticId)?.components
				.diagnostic;
			if (!diagnostic) throw new Error("Diagnostic not found.");
			const reportCandidate = diagnostic.reportCandidates?.find(
				(r) => r.id === input.reportCandidateId,
			);
			if (!reportCandidate) throw new Error("Report Candidate not found.");

			const damageMetric = reportCandidate.primaryEffect;
			const system = ctx.ecs.getEntityById(diagnostic.targetSystemId);
			const systemType = system?.components.isShipSystem?.type;
			if (!systemType) throw new Error("Invalid system.");
			const systemName =
				system?.components.identity?.name || capitalCase(systemType);

			const reportVariables = {
				damageType: reportCandidate.type,
				damageMetric,
				systemType,
				systemName,
				systemId: diagnostic.targetSystemId,
				shipId: diagnostic.shipId,
			} satisfies ReportVariables;

			const timelines = await selectAvailableTimelines(
				ctx.ecs,
				ctx.server.plugins.reduce((acc: ReportPlugin[], p) => {
					if (ctx.flight?.pluginIds.includes(p.id)) {
						acc.push(...p.aspects.reports);
					}
					return acc;
				}, []),
				ctx.flight?.mode,
				reportVariables,
			);

			const timeline = ctx.ecs.rng.nextFromList(timelines);
			if (!timeline) throw new Error("No damage report available.");

			// This automatically adds the timeline entity to ECS
			const damageReport = spawnTimeline(
				timeline,
				(entity) => ctx.ecs.addEntity(entity),
				diagnostic.shipId,
			);

			damageReport.updateComponent("identity", {
				name: `${systemName} ${reportCandidate.type}`,
			});
			damageReport.addComponent("damageReport", {
				shipId: diagnostic.shipId,
				systemId: diagnostic.targetSystemId,
				damageType: reportCandidate.type,
				affectedSystems: reportCandidate.affectedSystems,
			});

			// Put all the necessary variables on the timeline
			damageReport.addComponent("variables", {
				variables: [
					{
						name: "damageType",
						type: "any",
						value: reportVariables.damageType,
					},
					{
						name: "damageMetric",
						type: "any",
						value: reportVariables.damageMetric,
					},
					{
						name: "systemType",
						type: "any",
						value: reportVariables.systemType,
					},
					{
						name: "systemName",
						type: "any",
						value: reportVariables.systemName,
					},
					{ name: "systemId", type: "any", value: reportVariables.systemId },
					{ name: "shipId", type: "any", value: reportVariables.shipId },
				],
			});
			// Trigger the first step
			await triggerStep(
				ctx.flight.ecs.getEntityById(
					damageReport.components.isTimeline?.steps[0] || -1,
				)!,
			);
			// And delete the diagnostic
			ctx.ecs.removeEntityById(input.diagnosticId);
			pubsub.publish.damageReports.systemDiagnostic({
				systemId: diagnostic.targetSystemId,
			});
			pubsub.publish.damageReports.damageReports({ shipId: diagnostic.shipId });
			return { reportId: damageReport.id };
		}),
	abortDamageReport: t.procedure
		.input(z.object({ reportId: z.number() }))
		.send(({ ctx, input }) => {
			const damageReport = ctx.ecs.getEntityById(input.reportId);
			if (!damageReport) return;
			const stepIds: number[] = [];
			// Clear all of the steps and triggers
			for (const step of damageReport?.components.isTimeline?.steps || []) {
				stepIds.push(step);
				ctx.ecs.removeEntityById(step);
			}
			for (const trigger of ctx.ecs.componentCache.get("isTrigger") || []) {
				if (
					trigger.components.isTrigger?.stepId &&
					stepIds.includes(trigger.components.isTrigger.stepId)
				) {
					ctx.ecs.removeEntity(trigger);
				}
			}
			ctx.ecs.removeEntity(damageReport);
			pubsub.publish.damageReports.damageReports({
				shipId: damageReport.components.damageReport?.shipId || -1,
			});
			return null;
		}),
	applyDamageReportMetrics: t.procedure
		.meta({
			action: () => {
				return {
					timelineId: {
						name: "Damage Report ID ID",
						helper:
							"If using in damage report timeline action trigger, leave blank to complete the current damage report.",
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

			// Report timelines might apply their damage metrics upon completion
			applyDamageReportMetrics(timeline);
			return;
		}),
	stream: t.procedure
		.input(z.object({ shipId: z.number() }))
		.dataStream(({ ctx, input, entity }) => {
			if (!entity) return false;
			return Boolean(
				entity.components.diagnostic &&
					entity.components.diagnostic.shipId === input.shipId,
			);
		}),
});
