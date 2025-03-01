import { z } from "zod";
import { t } from "@thorium/.server/init/t";
import { getShipSystem } from "@thorium/utils/.server/ship/getShipSystem";
import type { isDestroyed } from "@thorium/ecs-components/isDestroyed";
import { type scanRecord, scanTypes } from "@thorium/utils/flags/scanTypes";
import { Entity } from "@thorium/utils/ecs";
import { pubsub } from "@thorium/.server/init/pubsub";
import { fromDate } from "dot-beat-time";
import { generateScanResults } from "@thorium/.server/systems/SensorScanSystem";

type IsDestroyed = Zod.infer<typeof isDestroyed>;

export const sensors = t.router({
	get: t.procedure
		.input(z.object({ shipId: z.number() }))
		.filter((publish: { shipId: number; systemId: number }, { ctx, input }) => {
			if (publish && publish.shipId !== input.shipId) return false;
			return true;
		})
		.request(({ ctx, input }) => {
			const sensors = getShipSystem(ctx.ecs, {
				systemType: "sensors",
				shipId: input.shipId,
			});

			return {
				id: sensors.id,
				passiveRange: sensors.components.isSensors?.passiveRange || 10_000,
				activeRange: sensors.components.isSensors?.activeRange || 100_000,
			};
		}),
	scanResult: t.procedure
		.input(z.object({ shipId: z.number(), objectId: z.number() }))
		.filter((publish: { objectId: number; shipId: number }, { input }) => {
			if (
				publish &&
				(publish.objectId !== input.objectId || publish.shipId !== input.shipId)
			)
				return false;
			return true;
		})
		.request(({ ctx, input }) => {
			const object = ctx.flight?.ecs.getEntityById(input.objectId);

			const sensors = getShipSystem(ctx.ecs, {
				systemType: "sensors",
				shipId: input.shipId,
			});
			const result: z.infer<typeof scanRecord> =
				sensors.components.isSensors?.resultsDatabase.get(input.objectId) ||
				({} as z.infer<typeof scanRecord>);
			if (object?.components.isPlanet || object?.components.isStar) {
				// Include the identity by default, since planets and stars are well-known.
				result.identification = generateScanResults(
					object,
					ctx.flight!.ecs,
					"identification",
				).identification;
			}
			return result;
		}),
	scans: t.procedure
		.input(z.object({ shipId: z.number() }))
		.filter((publish: { shipId: number }, { input }) => {
			if (publish && publish.shipId !== input.shipId) return false;
			return true;
		})
		.request(({ ctx, input }) => {
			const scans = [];
			for (const scan of ctx.flight?.ecs.componentCache.get("scan") || []) {
				const scanData = scan.components.scan;
				if (scanData && scanData.parentId === input.shipId) {
					scans.unshift({
						id: scan.id,
						type: scanData.type,
						progress: scanData.progress,
						repeatInterval: scanData.repeatInterval,
						intervalTime: scanData.intervalTime,
						target: scanData.target,
						time: fromDate(new Date(scanData.timestamp), true),
					});
				}
			}

			return scans;
		}),
	scanStart: t.procedure
		.input(
			z.object({
				shipId: z.number(),
				target: z.number(),
				type: scanTypes,
			}),
		)
		.send(({ ctx, input }) => {
			const scanEntity = new Entity();
			scanEntity.addComponent("scan", {
				type: input.type,
				target: input.target,
				parentId: input.shipId,
				progress: 0,
				timestamp: Date.now(),
			});
			ctx.flight?.ecs.addEntity(scanEntity);
			pubsub.publish.sensors.scans({ shipId: input.shipId });
		}),
	scanCancel: t.procedure
		.input(
			z.object({
				scanId: z.number(),
			}),
		)
		.send(({ ctx, input }) => {
			const shipId = ctx.ecs.getEntityById(input.scanId)?.components.scan
				?.parentId;
			ctx.flight?.ecs.removeEntityById(input.scanId);
			if (shipId) {
				pubsub.publish.sensors.scans({ shipId });
			}
		}),
	// scanRepeat: t.procedure,
	stream: t.procedure
		.input(z.object({ systemId: z.number().nullable(), shipId: z.number() }))
		.dataStream(({ ctx, input, entity }) => {
			if (!entity) return false;
			const systemId =
				input.systemId ||
				ctx.ecs.getEntityById(input.shipId)?.components.position?.parentId;
			if (typeof systemId === "undefined") {
				return false;
			}
			return Boolean(
				(entity.components.position &&
					entity.components.position.parentId === systemId) ||
					(entity.components.scan &&
						entity.components.scan.parentId === input.shipId),
			);
		}),
});
