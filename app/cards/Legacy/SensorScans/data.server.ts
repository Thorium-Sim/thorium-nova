import { pubsub } from "@thorium/.server/init/pubsub";
import { t } from "@thorium/.server/init/t";
import { getShipSystem } from "@thorium/utils/.server/ship/getShipSystem";
import { shipPubsubFilter } from "@thorium/utils/.server/shipPubsubFilter";
import { Entity } from "@thorium/utils/ecs";
import z from "zod";

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
				presetAnswers: sensors.scanAnswers,
				presetInfo: sensors.presetInfo,
				scanHistory: sensors.scanHistory,
			};
		}),
	setScanHistory: t.procedure
		.input(z.object({ shipId: z.number(), scanHistory: z.boolean() }))
		.send(({ ctx, input }) => {
			const sensorsSys = getShipSystem(ctx.ecs, {
				systemType: "sensors",
				shipId: input.shipId,
			});
			const sensors = sensorsSys.components.isLegacySensorScanning;

			if (!sensors) throw new Error("Sensors not found");

			sensorsSys.updateComponent("isLegacySensorScanning", {
				scanHistory: input.scanHistory,
			});
			pubsub.publish.legacy.sensorScans.sensors({ shipId: input.shipId });
		}),
	scans: t.procedure
		.input(z.object({ shipId: z.number() }))
		.filter(shipPubsubFilter)
		.autoPublish([], () => null)
		.request(({ ctx, input }) => {
			const sensorsSys = getShipSystem(ctx.ecs, {
				systemType: "sensors",
				shipId: input.shipId,
			});
			const sensors = sensorsSys.components.isLegacySensorScanning;

			if (!sensors) throw new Error("Sensors not found");
			const scans: {
				id: number;
				request: string;
				response: string;
				timestamp: number;
				inProgress: boolean;
				scanType: string;
			}[] = [];
			for (const scan of ctx.ecs.componentCache.get("scan") || []) {
				if (scan.components.scan?.parentId === input.shipId) {
					scans.push({
						id: scan.id,
						request: scan.components.scan.legacyRequest,
						response: scan.components.scan.legacyResponse,
						timestamp: scan.components.scan.timestamp,
						inProgress: scan.components.scan.progress < 1,
						scanType: scan.components.scan.legacyScanType,
					});
				}
			}
			scans.sort((a, b) => b.timestamp - a.timestamp);
			if (!sensors.scanHistory) {
				return scans.slice(0, 1);
			}
			return scans;
		}),

	beginScan: t.procedure
		.input(z.object({ shipId: z.number(), scan: z.string(), scanType: z.string() }))
		.send(({ ctx, input }) => {
			if (!input.scan.trim()) throw new Error("Scan request must not be empty");

			const sensorsSys = getShipSystem(ctx.ecs, {
				systemType: "sensors",
				shipId: input.shipId,
			});
			const sensors = sensorsSys.components.isLegacySensorScanning;

			if (!sensors) throw new Error("Sensors not found");
			if (
				sensorsSys.components.power &&
				sensorsSys.components.power.currentPower < sensorsSys.components.power.powerLevels[0]
			) {
				throw new Error("Insufficient power to complete sensor scan.");
			}
			if (sensorsSys.components.damage?.offline) {
				throw new Error("Unable to complete sensor scan while system is damaged.");
			}

			if (!sensors.scanHistory) {
				for (const scan of ctx.ecs.componentCache.get("scan") || []) {
					if (
						scan.components.scan?.parentId === input.shipId &&
						scan.components.scan.progress < 1
					) {
						throw new Error("Unable to complete sensor scan. Another scan is in progress.");
					}
				}
			}

			const scan = new Entity();
			scan.addComponent("scan", {
				parentId: input.shipId,
				progress: 0,
				legacyRequest: input.scan,
				legacyScanType: input.scanType,
				timestamp: Date.now(),
				// TODO September 20, 2025 - Make it so a contact can be selected by the crew to be the focus of the scan
			});
			ctx.ecs.addEntity(scan);
			pubsub.publish.legacy.sensorScans.scans({ shipId: input.shipId });

			return { scanId: scan.id };
		}),
	cancelScan: t.procedure.input(z.object({ scanId: z.number() })).send(({ ctx, input }) => {
		const scan = ctx.ecs.getEntityById(input.scanId);
		if (scan?.components.scan) {
			ctx.ecs.removeEntity(scan);
			pubsub.publish.legacy.sensorScans.scans({
				shipId: scan.components.scan.parentId,
			});
		}
	}),
	scanResponse: t.procedure
		.input(z.object({ scanId: z.number(), response: z.string() }))
		.send(({ ctx, input }) => {
			const scan = ctx.ecs.getEntityById(input.scanId);
			if (scan?.components.scan) {
				scan.updateComponent("scan", {
					legacyResponse: input.response,
					progress: 1,
				});
				pubsub.publish.legacy.sensorScans.scans({
					shipId: scan.components.scan.parentId,
				});
			}
		}),
});
