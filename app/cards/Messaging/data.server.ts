import z from "zod";
import { t } from "@thorium/.server/init/t";
import { shipPubsubFilter } from "@thorium/utils/.server/shipPubsubFilter";
import { Entity } from "@thorium/utils/ecs";
import { pubsub } from "@thorium/.server/init/pubsub";

export const messaging = t.router({
	messages: t.procedure
		.input(z.object({ shipId: z.number(), station: z.string().optional() }))
		.filter((publish: { shipId: number; station: string }, { ctx, input }) => {
			if (publish && publish.shipId !== input.shipId) return false;
			if (publish && input.station) {
				const station = ctx.ecs
					.getEntityById(input.shipId)
					?.components.stationComplement?.stations.find(
						(s) => s.name === input.station,
					);
				if (!station) return false;
				if (
					publish.station !== input.station &&
					!station.messageGroups.includes(publish.station)
				)
					return false;
			}
			return true;
		})
		.autoPublish(
			["isInternalMessage"],
			(entity) =>
				entity.components.isInternalMessage && [
					{
						shipId: entity.components.isInternalMessage.shipId,
						station: entity.components.isInternalMessage.sender,
					},
					{
						shipId: entity.components.isInternalMessage.shipId,
						station: entity.components.isInternalMessage.destination,
					},
				],
		)
		.request(({ ctx, input }) => {
			const messages: {
				id: number;
				timestamp: number;
				sender: string;
				destination: string;
				content: string;
			}[] = [];
			for (const message of ctx.ecs.componentCache.get("isInternalMessage") ||
				[]) {
				if (!message.components.isInternalMessage) continue;
				const { shipId, sender, destination, content, timestamp } =
					message.components.isInternalMessage;
				if (shipId !== input.shipId) continue;
				if (input.station) {
					const station = ctx.ecs
						.getEntityById(input.shipId)
						?.components.stationComplement?.stations.find(
							(s) => s.name === input.station,
						);
					const stationMatches = [
						destination,
						sender,
						...(station?.messageGroups || []),
					];
					if (!stationMatches.includes(input.station)) continue;
				}
				messages.push({
					id: message.id,
					timestamp,
					content,
					sender,
					destination,
				});
			}

			return messages;
		}),
	messageGroups: t.procedure
		.input(z.object({ shipId: z.number() }))
		.filter(shipPubsubFilter)
		.autoPublish([], () => null)
		.request(({ ctx, input }) => {
			return (
				ctx.ecs
					.getEntityById(input.shipId)
					?.components.stationComplement?.stations.reduce(
						(acc: string[], next) => {
							for (const item of next.messageGroups) {
								if (!acc.includes(item)) acc.push(item);
							}
							return acc;
						},
						[],
					) || []
			);
		}),
	sendInternalMessage: t.procedure
		.input(
			z.object({
				shipId: z.number(),
				destination: z.string(),
				sender: z.string(),
				content: z.string(),
			}),
		)
		.send(({ ctx, input }) => {
			const message = new Entity();
			message.addComponent("isInternalMessage", {
				...input,
				timestamp: Date.now(),
			});
			ctx.ecs.addEntity(message);
			pubsub.publish.messaging.messages({
				shipId: input.shipId,
				station: input.destination,
			});
			pubsub.publish.messaging.messages({
				shipId: input.shipId,
				station: input.sender,
			});
		}),
});
