import { t } from "@thorium/.server/init/t";
import { pubsub } from "@thorium/.server/init/pubsub";
import { z } from "zod";

export const alertLevel = t.router({
	update: t.procedure
		.meta({ action: true, event: true })
		.input(
			z.object({
				shipId: z.number(),
				alertLevel: z.union([
					z.literal("5"),
					z.literal("4"),
					z.literal("3"),
					z.literal("2"),
					z.literal("1"),
					z.literal("p"),
				]),
			}),
		)
		.send(({ ctx, input }) => {
			const ship = ctx.flight?.ecs.getEntityById(input.shipId || -1);
			if (!ship?.components.isShip) return;

			ship.updateComponent("isShip", { alertLevel: input.alertLevel });
			pubsub.publish.ship.get({ shipId: ship.id });
			pubsub.publish.starmapCore.object({ objectId: ship.id });
		}),
});
