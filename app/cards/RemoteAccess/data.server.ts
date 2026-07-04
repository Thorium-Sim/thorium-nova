import { pubsub } from "@thorium/.server/init/pubsub";
import { t } from "@thorium/.server/init/t";
import { triggerAction } from "@thorium/utils/.server/triggerAction";
import { Entity } from "@thorium/utils/ecs";
import z from "zod";

export const remoteAccess = t.router({
	codes: t.procedure
		.input(z.object({ shipId: z.number() }))
		.filter((publish: { shipId?: number }, { input }) => {
			if (publish && publish.shipId !== input.shipId) return false;
			return true;
		})
		.autoPublish(
			["remoteAccessCode"],
			(entity) =>
				entity.components.remoteAccessCode && {
					shipId: entity.components.remoteAccessCode.shipId,
				},
		)
		.request(({ ctx, input: { shipId } }) => {
			const codes = (
				[...(ctx.ecs.componentCache.get("remoteAccessCode") || [])].filter(
					(e) => e.components.remoteAccessCode?.shipId === shipId,
				) || []
			).map((code) => ({
				id: code.id,
				code: code.components.remoteAccessCode?.code,
				state: code.components.remoteAccessCode?.state,
				station: ctx.getFlightClient(code.components.remoteAccessCode?.clientId || "")?.components
					.flightClient?.stationId,
				timestamp: code.components.remoteAccessCode?.timestamp,
				time: code.components.remoteAccessCode?.timestamp
					? new Date(code.components.remoteAccessCode?.timestamp).toLocaleTimeString()
					: "",
			}));

			return codes;
		}),
	send: t.procedure
		.meta({ event: true })
		.input(z.object({ clientId: z.string(), code: z.string().min(1) }))
		.output(z.object({ remoteAccessCodeId: z.number(), code: z.string(), shipId: z.number() }))
		.send(({ ctx, input: { clientId, code } }) => {
			const remoteAccessCode = new Entity();
			const client = ctx.getFlightClient(clientId)?.components.flightClient;
			const shipId = client?.shipId;
			if (!shipId) throw new Error("Ship not found");
			remoteAccessCode.addComponent("remoteAccessCode", {
				shipId,
				clientId,
				code,
				state: "waiting",
				timestamp: Date.now(),
				station: client?.stationId,
			});
			ctx.flight?.ecs.addEntity(remoteAccessCode);

			pubsub.publish.remoteAccess.codes({ shipId });
			return { remoteAccessCodeId: remoteAccessCode.id, code, shipId };
		}),

	accept: t.procedure
		.meta({ action: true, event: true })
		.input(z.object({ remoteAccessCodeId: z.number() }))
		.output(z.object({ remoteAccessCodeId: z.number() }))
		.send(async ({ ctx, input }) => {
			const { remoteAccessCodeId } = input;
			const remoteAccessCode = ctx.flight?.ecs.getEntityById(remoteAccessCodeId);
			if (!remoteAccessCode) throw new Error("Invalid Remote Access Code");

			remoteAccessCode.updateComponent("remoteAccessCode", {
				state: "accepted",
			});
			ctx.flight?.ecs.removeEntity(remoteAccessCode);
			pubsub.publish.remoteAccess.codes({
				shipId: remoteAccessCode.components.remoteAccessCode?.shipId,
			});

			const code = remoteAccessCode.components.remoteAccessCode;
			if (code) {
				await triggerAction("effects.notify", {
					clientName: code.clientId,
					color: "success",
					shipId: code.shipId,
					title: `Remote Access Code ${code.code} Accepted`,
				});
			}
			return input;
		}),
	deny: t.procedure
		.meta({ action: true, event: true })
		.input(z.object({ remoteAccessCodeId: z.number() }))
		.send(async ({ ctx, input }) => {
			const { remoteAccessCodeId } = input;
			const remoteAccessCode = ctx.flight?.ecs.getEntityById(remoteAccessCodeId);
			if (!remoteAccessCode) throw new Error("Invalid Remote Access Code");

			remoteAccessCode.updateComponent("remoteAccessCode", {
				state: "denied",
			});
			ctx.flight?.ecs.removeEntity(remoteAccessCode);
			pubsub.publish.remoteAccess.codes({
				shipId: remoteAccessCode.components.remoteAccessCode?.shipId,
			});

			const code = remoteAccessCode.components.remoteAccessCode;
			if (code) {
				await triggerAction("effects.notify", {
					clientName: code.clientId,
					color: "error",
					shipId: code.shipId,
					title: `Remote Access Code ${code.code} Denied`,
				});
			}
			return input;
		}),
});
