import type ReportPlugin from "@thorium/.server/classes/Plugins/Report";
import { pubsub } from "@thorium/.server/init/pubsub";
import { t } from "@thorium/.server/init/t";
import { spawnTimeline } from "@thorium/.server/spawners/timeline";
import type { ShipSystemTypes } from "@thorium/ecs-components/shipSystems";
import { damageEffectsObject } from "@thorium/ecs-components/shipSystems/damageEffectsObject";
import type { ReportVariables } from "@thorium/routes/config/reports/reportAvailableVariables";
import { applyDamageReportMetrics } from "@thorium/utils/.server/applyDamageReportMetrics";
import { triggerStep } from "@thorium/utils/.server/evaluateEntityQuery";
import { selectAvailableTimelines } from "@thorium/utils/.server/executeBlocks";
import { ECS, Entity } from "@thorium/utils/ecs";
import {
	damageEffects,
	damageTypes,
	damageTypeValues,
	getAggregateDamage,
	getReportEffects,
} from "@thorium/utils/flags/damageTypes";
import { capitalCase } from "change-case";
import z from "zod";

export const damageReports = t.router({
	systems: t.procedure
		.input(z.object({ shipId: z.number() }))
		.filter((publish: { shipId: number }, { input }) => {
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
			for (const systemId of ship?.components.shipSystems?.shipSystems.keys() || []) {
				const system = ctx.ecs.getEntityById(systemId);
				if (!system?.components.isShipSystem || !system.components.damage) continue;
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
		.filter((publish: { systemId: number }, { input }) => {
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
		.output(
			z.object({
				shipId: z.number(),
				systemId: z.number(),
				diagnosticId: z.number(),
				level: z.enum(["1", "2", "3", "4"]),
			}),
		)
		.meta({ event: true })
		.send(({ ctx, input }) => {
			const system = ctx.ecs.getEntityById(input.systemId);
			const ship = ctx.ecs.getEntityById(system?.components.isShipSystem?.shipId || -1);
			if (!ship) throw new Error("Invalid system ID: System is not assigned to a ship");

			const diagnostic = new Entity();
			diagnostic.addComponent("identity", {
				name: `Level ${input.level} ${system?.components.identity?.name || ""} Diagnostic`,
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
			return { ...input, diagnosticId: diagnostic.id, shipId: ship.id };
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
		.output(
			z.object({
				shipId: z.number(),
				diagnosticId: z.number(),
				damageMetric: z.enum(damageEffects),
			}),
		)
		.meta({ event: true })
		.send(({ ctx, input }) => {
			const diagnostic = ctx.ecs.getEntityById(input.diagnosticId);
			if (!diagnostic) throw new Error("Diagnostic not found");

			const reportCount = Number(diagnostic.components.diagnostic?.level || 1) - 1;
			if (reportCount <= 0) throw new Error("Invalid report count");

			const system = ctx.ecs.getEntityById(diagnostic.components.diagnostic?.targetSystemId || -1);
			if (!system) throw new Error("Diagnostic system not found");

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
			return { ...input, shipId: diagnostic.components.diagnostic?.shipId || -1 };
		}),
	damageReports: t.procedure
		.input(z.object({ shipId: z.number() }))
		.filter((publish: { shipId: number }, { input }) => {
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
				const currentTimelineStep = ctx.ecs.getEntityById(timeline.steps[currentStepIndex]);
				reports.push({
					id: report.id,
					systemId: report.components.damageReport.systemId,
					name: report.components.identity?.name || "Report",
					stepCount: timeline.steps.length,
					currentStepIndex,
					currentStepText: currentTimelineStep?.components.identity?.description || "",
				});
			}
			return reports;
		}),
	beginDamageReportFromDiagnostic: t.procedure
		.input(z.object({ diagnosticId: z.number(), reportCandidateId: z.string() }))
		.send(async ({ ctx, input }) => {
			if (!ctx.flight) throw new Error("Flight is not started.");
			const diagnostic = ctx.ecs.getEntityById(input.diagnosticId)?.components.diagnostic;
			if (!diagnostic) throw new Error("Diagnostic not found.");
			const reportCandidate = diagnostic.reportCandidates?.find(
				(r) => r.id === input.reportCandidateId,
			);
			if (!reportCandidate) throw new Error("Report Candidate not found.");
			const damageMetric = reportCandidate.primaryEffect;
			const system = ctx.ecs.getEntityById(diagnostic.targetSystemId);
			const systemType = system?.components.isShipSystem?.type;
			if (!systemType) throw new Error("Invalid system.");
			const systemName = system?.components.identity?.name || capitalCase(systemType);
			const reportName = `${systemName} ${reportCandidate.type}`;

			const reportVariables = {
				damageType: reportCandidate.type,
				damageMetric,
				systemType,
				systemName,
				systemId: system.id,
				shipId: diagnostic.shipId,
			} satisfies Omit<ReportVariables, "damageReportId">;

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

			// Group the timelines by categories, so one category with a bunch of reports doesn't dominate
			const categories = Object.entries(Object.groupBy(timelines, (t) => t.category))
				.map(([_, value]) => {
					return value!;
				})
				.filter((c) => c && c.length > 0);
			const categoryList = ctx.ecs.rng.nextFromList(categories);

			const timeline = ctx.ecs.rng.nextFromList(categoryList);
			if (!timeline) throw new Error("No damage report available.");

			const { reportId } = await createDamageReport(
				ctx.ecs,
				timeline,
				reportName,
				reportVariables,
				true, // All standard damage reports are abortable
				reportCandidate.affectedSystems,
			);

			// And delete the diagnostic
			ctx.ecs.removeEntityById(input.diagnosticId);
			pubsub.publish.damageReports.systemDiagnostic({
				systemId: diagnostic.targetSystemId,
			});
			pubsub.publish.damageReports.damageReports({ shipId: diagnostic.shipId });

			return { reportId };
		}),
	beginDamageReport: t.procedure
		.input(
			z.object({
				timeline: z.string().optional(),
				shipId: z.number(),
				reportName: z.string().optional(),
				systemId: z.number().optional(),
				damageType: damageTypes.optional(),
				damageMetric: z.enum(damageEffects).optional(),
				abortable: z.coerce.boolean(),
			}),
		)
		.output(z.object({ reportId: z.number(), reportName: z.string() }))
		.meta({
			event: true,
			action: () => {
				return {
					timeline: {
						type: "text",
						helper:
							"The name or #tag of the report timeline to use, but only if the timeline qualifies. If blank it will use a random qualifying timeline.",
					},
					reportName: {
						type: "text",
						helper:
							"The name that the crew will see for the report. Leave blank to use the report timeline's name.",
					},
					abortable: {
						type: "checkbox",
						inputProps: {
							defaultChecked: true,
						},
						helper: "Whether the crew is able to abort the report themselves.",
					},
				};
			},
		})
		.send(async ({ ctx, input }) => {
			if (!ctx.flight) throw new Error("Flight is not started.");

			const system = ctx.ecs.getEntityById(input.systemId || -1);
			const systemType = system?.components.isShipSystem?.type || "generic";
			const systemName = system?.components.identity?.name || capitalCase(systemType);

			const reportVariables = {
				damageType: input.damageType,
				damageMetric: input.damageMetric,
				systemType,
				systemName,
				systemId: input.systemId,
				shipId: input.shipId,
			} satisfies Omit<ReportVariables, "damageReportId">;

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
			let timeline: ReportPlugin;
			if (input.timeline) {
				const timelineName = input.timeline;
				if (input.timeline.startsWith("#")) {
					const tag = timelineName.replace("#", "");
					timeline = ctx.ecs.rng.nextFromList(timelines.filter((t) => t.tags.includes(tag)));
					if (!timeline) throw new Error(`Could not find report timeline by tag: ${timelineName}`);
				} else {
					const namedTimeline = timelines.find((t) => t.name === timelineName);
					if (!namedTimeline) throw new Error(`Could not find report timeline: ${timelineName}`);
					timeline = namedTimeline;
				}
			} else {
				timeline = ctx.ecs.rng.nextFromList(timelines);
			}

			if (!timeline) throw new Error("No report timeline available.");
			const reportName = input.reportName || timeline.name;

			const { reportId } = await createDamageReport(
				ctx.ecs,
				timeline,
				reportName,
				reportVariables,
				input.abortable,
			);

			pubsub.publish.damageReports.damageReports({ shipId: input.shipId });
			return { reportId, reportName };
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
			for (const assignment of ctx.ecs.componentCache.get("damageControlAssignment") || []) {
				if (assignment.components.damageControlAssignment?.damageReportId === input.reportId) {
					ctx.ecs.removeEntity(assignment);
				}
			}
			ctx.ecs.removeEntity(damageReport);
			pubsub.publish.damageReports.damageReports({
				shipId: damageReport.components.damageReport?.shipId || -1,
			});
			return null;
		}),
	applyDamageReportMetrics: t.procedure
		.input(
			z.object({
				timelineId: z.number(),
			}),
		)
		.meta({
			action: () => {
				return {
					timelineId: {
						name: "Damage Report ID",
						helper:
							"If using in damage report timeline action trigger, leave blank to complete the current damage report.",
					},
				};
			},
		})
		.send(async ({ ctx, input }) => {
			const timeline = ctx.flight?.ecs.getEntityById(input.timelineId);
			if (!timeline) throw new Error("Timeline not found.");

			// Report timelines might apply their damage metrics upon completion
			applyDamageReportMetrics(timeline);
			return;
		}),
	// This is mostly used for listening for the event
	completeDamageAssignment: t.procedure
		.meta({ event: true })
		.input(z.object({ damageAssignmentId: z.number() }))
		.output(z.object({ damageAssignmentId: z.number() }))
		.send(({ ctx, input }) => {
			ctx.ecs.removeEntityById(input.damageAssignmentId);

			return input;
		}),
	stream: t.procedure.input(z.object({ shipId: z.number() })).dataStream(({ input, ctx }) => {
		const set = new Set<Entity>();
		for (const diagnostic of ctx.ecs.componentCache.get("diagnostic") || []) {
			if (diagnostic.components.diagnostic?.shipId === input.shipId) {
				set.add(diagnostic);
			}
		}
		return set;
	}),
});

async function createDamageReport(
	ecs: ECS,
	timeline: ReportPlugin,
	name: string,
	reportVariables: Omit<ReportVariables, "damageReportId">,
	abortable: boolean,
	affectedSystems?: { id: number; name: string; effects: z.infer<typeof damageEffectsObject> }[],
) {
	const { shipId, systemId, damageType } = reportVariables;
	const reportEntity = new Entity();

	// This automatically adds the timeline entity to ECS
	const damageReport = spawnTimeline(
		timeline,
		(entity) => ecs.addEntity(entity),
		shipId,
		reportEntity,
	);

	damageReport.updateComponent("identity", {
		name,
	});
	damageReport.addComponent("damageReport", {
		shipId,
		systemId,
		damageType,
		affectedSystems,
		abortable,
	});

	// Put all the necessary variables on the timeline
	damageReport.addComponent("variables", {
		variables: [
			{
				name: "damageReportId",
				type: "any",
				value: damageReport.id,
			},
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
	await triggerStep(ecs.getEntityById(damageReport.components.isTimeline?.steps[0] || -1)!);

	return { reportId: damageReport.id };
}
