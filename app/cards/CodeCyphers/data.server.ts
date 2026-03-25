import { pubsub } from "@thorium/.server/init/pubsub";
import { t } from "@thorium/.server/init/t";
import { getShipSystem } from "@thorium/utils/.server/ship/getShipSystem";
import { shipPubsubFilter } from "@thorium/utils/.server/shipPubsubFilter";
import { produce } from "immer";
import z from "zod";

export const codeCyphers = t.router({
	availableCyphers: t.procedure
		.input(z.object({ shipId: z.number(), isCore: z.boolean().optional() }))
		.filter(shipPubsubFilter)
		.autoPublish(["isLongRangeComm"], (entity) =>
			entity.components.isShipSystem?.shipId
				? { shipId: entity.components.isShipSystem?.shipId }
				: null,
		)
		.request(({ ctx, input }) => {
			const longRangeSys = getShipSystem(ctx.ecs, {
				shipId: input.shipId,
				systemType: "longRangeComm",
			});
			const longRange = longRangeSys?.components.isLongRangeComm;
			if (!longRange) throw new Error("Long Range Comm system not found");

			if (input.isCore) return longRange.cyphers;
			return longRange.cyphers.filter((c) => c.active);
		}),
	setCypherAvailable: t.procedure
		.input(
			z.object({
				shipId: z.number(),
				cypherFont: z.string(),
				active: z.boolean(),
			}),
		)
		.send(({ ctx, input }) => {
			const longRangeSys = getShipSystem(ctx.ecs, {
				shipId: input.shipId,
				systemType: "longRangeComm",
			});
			const longRange = longRangeSys?.components.isLongRangeComm;
			if (!longRange) throw new Error("Long Range Comm system not found");

			longRangeSys.updateComponent("isLongRangeComm", {
				cyphers: produce(longRange.cyphers, (draft) => {
					const cypher = draft.find((c) => c.font === input.cypherFont);
					if (cypher) {
						cypher.active = input.active;
					}
				}),
			});
			pubsub.publish.codeCyphers.availableCyphers({ shipId: input.shipId });
		}),
});
