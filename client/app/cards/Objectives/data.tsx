import { t } from "@server/init/t";
import { pubsub } from "@server/init/pubsub";
import { z } from "zod";
import { Entity } from "@server/utils/ecs";

export const objectives = t.router({
	get: t.procedure
		.input(z.object({ shipId: z.number().optional() }))
		.filter((publish: { shipId: number }, { ctx, input }) => {
			if (publish && (input.shipId || ctx.ship?.id) !== publish.shipId)
				return false;
			return true;
		})
		.request(({ ctx, input }) => {
			const ship = input.shipId
				? ctx.flight?.ecs.getEntityById(input.shipId)
				: ctx.ship;
			if (!ship) return [];

			const objectives: {
				id: number;
				title: string;
				description?: string;
				state: "active" | "complete" | "cancelled";
				crewComplete: boolean;
				priority: number;
			}[] = [];
			const objectiveEntities =
				ctx.flight?.ecs.componentCache.get("isObjective") || [];
			for (const objective of objectiveEntities) {
				if (
					objective.components.isObjective?.shipId === ship.id &&
					objective.components.identity
				) {
					const { state, crewComplete, priority } =
						objective.components.isObjective;
					const { name, description } = objective.components.identity;
					objectives.push({
						id: objective.id,
						state,
						crewComplete,
						priority,
						title: name,
						description,
					});
				}
			}
			return objectives;
		}),
	add: t.procedure
		.meta({ action: true, event: true })
		.input(
			z.object({
				shipId: z.number().optional(),
				title: z.string(),
				description: z.string().optional(),
				crewComplete: z.boolean().optional(),
				priority: z.number().optional(),
			}),
		)
		.send(({ ctx, input }) => {
			const ship = input.shipId
				? ctx.flight?.ecs.getEntityById(input.shipId)
				: ctx.ship;
			if (!ship) return;

			const objective = new Entity();
			objective.addComponent("isObjective", {
				shipId: ship.id,
				state: "active",
				crewComplete: input.crewComplete || false,
				priority: input.priority || 0,
			});
			objective.addComponent("identity", {
				name: input.title,
				description: input.description || "",
			});
			ctx.flight?.ecs.addEntity(objective);

			pubsub.publish.objectives.get({ shipId: ship.id });
		}),
	setState: t.procedure
		.meta({ action: true, event: true })
		.input(
			z.object({
				objectiveId: z.number(),
				state: z.enum(["active", "complete", "cancelled"]),
			}),
		)
		.send(({ ctx, input }) => {
			const objective = ctx.flight?.ecs.getEntityById(input.objectiveId);
			if (!objective) return;

			objective.updateComponent("isObjective", { state: input.state });

			if (objective.components.isObjective?.shipId) {
				pubsub.publish.objectives.get({
					shipId: objective.components.isObjective.shipId,
				});
			}
		}),
	setCrewComplete: t.procedure
		.meta({ action: true, event: true })
		.input(
			z.object({
				objectiveId: z.number(),
				crewComplete: z.boolean(),
			}),
		)
		.send(({ ctx, input }) => {
			const objective = ctx.flight?.ecs.getEntityById(input.objectiveId);
			if (!objective) return;

			objective.updateComponent("isObjective", {
				crewComplete: input.crewComplete,
			});

			if (objective.components.isObjective?.shipId) {
				pubsub.publish.objectives.get({
					shipId: objective.components.isObjective.shipId,
				});
			}
		}),
	setPriority: t.procedure
		.meta({ action: true, event: true })
		.input(
			z.object({
				objectiveId: z.number(),
				priority: z.number(),
			}),
		)
		.send(({ ctx, input }) => {
			const objective = ctx.flight?.ecs.getEntityById(input.objectiveId);
			if (!objective) return;

			objective.updateComponent("isObjective", {
				priority: input.priority,
			});

			if (objective.components.isObjective?.shipId) {
				pubsub.publish.objectives.get({
					shipId: objective.components.isObjective.shipId,
				});
			}
		}),
});
