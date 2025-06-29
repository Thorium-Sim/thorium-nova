import { t } from "@thorium/.server/init/t";
import { pubsub } from "@thorium/.server/init/pubsub";
import { z } from "zod";

export const officersLog = t.router({
	get: t.procedure
		.input(z.object({ clientId: z.string() }))
		.filter((publish: { clientId: string }, { input }) => {
			if (publish && input.clientId !== publish.clientId) return false;
			return true;
		})
		.request(({ ctx, input }) => {
			return ctx.getFlightClient(input.clientId)?.officersLog || [];
		}),
	add: t.procedure
		.input(
			z.object({
				clientId: z.string(),
				message: z.string(),
				timestamp: z.number(),
			}),
		)
		.send(({ ctx, input }) => {
			const { message, timestamp = Date.now() } = input;

			ctx.getFlightClient(input.clientId)?.officersLog.push({
				message,
				timestamp,
			});

			pubsub.publish.officersLog.get({ clientId: input.clientId });
		}),
});
