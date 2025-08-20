import z from "zod";
import { t } from "@thorium/.server/init/t";
import { getAggregateDamage } from "@thorium/utils/flags/damageTypes";
import { Entity } from "@thorium/utils/ecs";
import { pubsub } from "@thorium/.server/init/pubsub";

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
					};
				}
			}
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
				systemId: z.number(),
				damageMetric: z.number(),
				reportCount: z.number(),
			}),
		)
		.send(({ ctx, input }) => {}),
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
		.request(({ ctx, input }) => {}),

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
