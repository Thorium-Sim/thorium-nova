import { pubsub } from "@thorium/.server/init/pubsub";
import { t } from "@thorium/.server/init/t";
import { getShipSystem } from "@thorium/utils/.server/ship/getShipSystem";
import { shipPubsubFilter } from "@thorium/utils/.server/shipPubsubFilter";
import z from "zod";

export const thrusters = t.router({
	get: t.procedure
		.input(z.object({ shipId: z.number() }))
		.filter(shipPubsubFilter)
		.autoPublish(
			["isThrusters"],
			(entity) =>
				entity.components.isShipSystem && {
					shipId: entity.components.isShipSystem?.shipId,
				},
		)
		.request(({ ctx, input }) => {
			const thrusters = getShipSystem(ctx.ecs, {
				systemType: "thrusters",
				shipId: input.shipId,
			});
			const ship = ctx.ecs.getEntityById(input.shipId);
			const rotation = ship?.components.rotation;
			if (!thrusters)
				throw new Error(
					`No thrusters assigned to ship ${ship?.components.identity?.name || input.shipId}`,
				);
			return {
				rotation: {
					yaw: rotation?.yaw || 0,
					pitch: rotation?.pitch || 0,
					roll: rotation?.roll || 0,
				},
				direction: thrusters.components.isThrusters!.direction,
				requiredRotation: thrusters.components.isThrusters!.requiredRotation,
				rotationSpeed: thrusters.components.isThrusters!.rotationMaxSpeed,
			};
		}),
	setRequiredRotation: t.procedure
		.input(
			z.object({
				shipId: z.number(),
				rotation: z
					.object({
						yaw: z.number(),
						pitch: z.number(),
						roll: z.number(),
					})
					.partial(),
			}),
		)
		.send(({ ctx, input }) => {
			const thrusters = getShipSystem(ctx.ecs, {
				systemType: "thrusters",
				shipId: input.shipId,
			});
			const ship = ctx.ecs.getEntityById(input.shipId);

			if (!thrusters)
				throw new Error(
					`No thrusters assigned to ship ${ship?.components.identity?.name || input.shipId}`,
				);

			thrusters.updateComponent("isThrusters", {
				requiredRotation: {
					yaw: 0,
					pitch: 0,
					roll: 0,
					...thrusters.components.isThrusters?.requiredRotation,
					...input.rotation,
				},
			});
			pubsub.publish.legacy.thrusters.get({ shipId: input.shipId });
		}),
	setRotationSpeed: t.procedure
		.input(
			z.object({
				shipId: z.number(),
				rotationSpeed: z.number(),
			}),
		)
		.send(({ ctx, input }) => {
			const thrusters = getShipSystem(ctx.ecs, {
				systemType: "thrusters",
				shipId: input.shipId,
			});
			const ship = ctx.ecs.getEntityById(input.shipId);

			if (!thrusters)
				throw new Error(
					`No thrusters assigned to ship ${ship?.components.identity?.name || input.shipId}`,
				);

			thrusters.updateComponent("isThrusters", {
				rotationMaxSpeed: input.rotationSpeed,
			});
			pubsub.publish.legacy.thrusters.get({ shipId: input.shipId });
		}),
});
