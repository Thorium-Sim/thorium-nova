import { pubsub } from "@thorium/.server/init/pubsub";
import { t } from "@thorium/.server/init/t";
import { getShipSystem } from "@thorium/utils/.server/ship/getShipSystem";
import { shipPubsubFilter } from "@thorium/utils/.server/shipPubsubFilter";
import { z } from "zod";

export const sensorScans = t.router({
	sensors: t.procedure
		.input(z.object({ shipId: z.number() }))
		.filter(shipPubsubFilter)
		.autoPublish(["isLegacySensorScanning"], (entity) =>
			entity.components.isShipSystem?.shipId
				? { shipId: entity.components.isShipSystem?.shipId }
				: null,
		)
		.request(({ ctx, input }) => {
			const sensorsSys = getShipSystem(ctx.ecs, {
				systemType: "sensors",
				shipId: input.shipId,
			});
			const sensors = sensorsSys.components.isLegacySensorScanning;

			if (!sensors) throw new Error("Sensors not found");

			return {
				id: sensorsSys.id,
				presetAnswers: sensors.presetAnswers,
				presetInfo: sensors.presetInfo,
				scanHistory: sensors.scanHistory,
				processedData: sensors.processedData,
			};
		}),
	sendProcessedData: t.procedure
		.input(z.object({ shipId: z.number(), data: z.string() }))
		.send(({ ctx, input }) => {
			const sensorsSys = getShipSystem(ctx.ecs, {
				systemType: "sensors",
				shipId: input.shipId,
			});
			const sensors = sensorsSys.components.isLegacySensorScanning;

			if (!sensors) throw new Error("Sensors not found");

			sensorsSys.updateComponent("isLegacySensorScanning", {
				processedData: sensors.processedData.concat({
					timestamp: Date.now(),
					data: input.data,
				}),
			});

			pubsub.publish.legacy.sensorScans.sensors({ shipId: input.shipId });
		}),
});
