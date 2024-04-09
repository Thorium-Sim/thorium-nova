import { pubsub } from "@server/init/pubsub";
import { t } from "@server/init/t";
import { Entity } from "@server/utils/ecs";
import { z } from "zod";

export const remoteAccess = t.router({
	codes: t.procedure
		.input(z.object({ shipId: z.number().optional() }).optional())
		.filter((publish: { shipId?: number }, { ctx }) => {
			if (publish && publish.shipId !== ctx.ship?.id) return false;
			return true;
		})
		.request(({ ctx, input }) => {
			const shipId = input?.shipId ?? ctx.ship?.id;
			const codes = (
				ctx.flight?.ecs.entities.filter(
					(e) => e.components.remoteAccessCode?.shipId === shipId,
				) || []
			).map((code) => ({
				id: code.id,
				code: code.components.remoteAccessCode?.code,
				state: code.components.remoteAccessCode?.state,
				station:
					ctx.flight?.clients[code.components.remoteAccessCode?.clientId || ""]
						.stationId,
				timestamp: code.components.remoteAccessCode?.timestamp,
				time: code.components.remoteAccessCode?.timestamp
					? new Date(
							code.components.remoteAccessCode?.timestamp,
					  ).toLocaleTimeString()
					: "",
			}));

			return codes;
		}),
	send: t.procedure
		.input(z.object({ code: z.string().min(1) }))
		.send(({ ctx, input }) => {
			const { code } = input;
			const clientId = ctx.id;
			const shipId = ctx.ship?.id;
			if (!shipId) return;

			const remoteAccessCode = new Entity();
			remoteAccessCode.addComponent("remoteAccessCode", {
				shipId,
				clientId,
				code,
				state: "waiting",
				timestamp: Date.now(),
				station: ctx.flightClient?.stationId,
			});
			ctx.flight?.ecs.addEntity(remoteAccessCode);

			pubsub.publish.remoteAccess.codes({ shipId });
			return remoteAccessCode.id;
		}),

	accept: t.procedure
		.input(z.object({ id: z.number() }))
		.send(({ ctx, input }) => {
			const { id } = input;
			const remoteAccessCode = ctx.flight?.ecs.getEntityById(id);
			if (!remoteAccessCode) return;

			remoteAccessCode.updateComponent("remoteAccessCode", {
				state: "accepted",
			});
			ctx.flight?.ecs.removeEntity(remoteAccessCode);
			pubsub.publish.remoteAccess.codes({
				shipId: remoteAccessCode.components.remoteAccessCode?.shipId,
			});

			// TODO: Add notification to the client
		}),
	deny: t.procedure
		.input(z.object({ id: z.number() }))
		.send(({ ctx, input }) => {
			const { id } = input;
			const remoteAccessCode = ctx.flight?.ecs.getEntityById(id);
			if (!remoteAccessCode) return;

			remoteAccessCode.updateComponent("remoteAccessCode", {
				state: "denied",
			});
			ctx.flight?.ecs.removeEntity(remoteAccessCode);
			pubsub.publish.remoteAccess.codes({
				shipId: remoteAccessCode.components.remoteAccessCode?.shipId,
			});

			// TODO: Add notification to the client
		}),
});
