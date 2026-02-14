import { t } from "@thorium/.server/init/t";
import { pubsub } from "@thorium/.server/init/pubsub";
import { z } from "zod";

const alertLevelValues = z.union([
	z.literal("5"),
	z.literal("4"),
	z.literal("3"),
	z.literal("2"),
	z.literal("1"),
	z.literal("p"),
]);
export const alertLevel = t.router({
	update: t.procedure
		.meta({ action: true, event: true })
		.input(
			z.object({
				shipId: z.number(),
				alertLevel: alertLevelValues,
			}),
		)
		.output(z.object({ alertLevel: alertLevelValues, shipId: z.number() }))
		.send(({ ctx, input }) => {
			const ship = ctx.ecs.getEntityById(input.shipId || -1);
			if (!ship?.components.isShip) throw new Error("Ship not found");

			ship.updateComponent("isShip", { alertLevel: input.alertLevel });
			pubsub.publish.ship.player({ shipId: ship.id });
			pubsub.publish.ship.get({ shipId: ship.id });
			pubsub.publish.starmapCore.object({ objectId: ship.id });

			return { shipId: ship.id, alertLevel: input.alertLevel };
		}),
});
