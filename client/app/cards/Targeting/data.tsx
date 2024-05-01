import { t } from "@server/init/t";
import { pubsub } from "@server/init/pubsub";
import { z } from "zod";
import { getShipSystem } from "@server/utils/getShipSystem";

export const targeting = t.router({
	targetedContact: t.procedure
		.filter((publish: { shipId: number }, { ctx }) => {
			if (publish && publish.shipId !== ctx.ship?.id) return false;
			return true;
		})
		.request(({ ctx }) => {
			const system = getShipSystem(ctx, {
				systemType: "targeting",
			});
			return system.components.isTargeting?.target || null;
		}),
	setTarget: t.procedure
		.input(z.object({ target: z.union([z.number(), z.null()]) }))
		.send(({ input, ctx }) => {
			if (!ctx.ship) throw new Error("No ship found.");
			const targeting = getShipSystem(ctx, {
				systemType: "targeting",
			});
			if (!targeting.components.isTargeting)
				throw new Error("System is not a impulse engine");

			targeting.updateComponent("isTargeting", { target: input.target });
			pubsub.publish.targeting.targetedContact({
				shipId: ctx.ship.id,
			});
		}),
});
