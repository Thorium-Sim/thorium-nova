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
		.autoPublish(
			["flightClient"],
			(entity) =>
				entity.components.flightClient && {
					clientId: entity.components.flightClient.clientId,
				},
		)
		.request(({ ctx, input }) => {
			return (
				ctx.getFlightClient(input.clientId)?.components.flightClient
					?.officersLog || []
			);
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
			const flightClientEntity = ctx.getFlightClient(input.clientId);
			flightClientEntity?.updateComponent("flightClient", {
				officersLog:
					flightClientEntity?.components.flightClient?.officersLog.concat({
						message,
						timestamp,
					}) || [{ message, timestamp }],
			});
			pubsub.publish.officersLog.get({ clientId: input.clientId });
		}),
});
