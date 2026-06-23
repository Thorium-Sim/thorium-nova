import { pubsub } from "@thorium/.server/init/pubsub";
import { t } from "@thorium/.server/init/t";
import { generateScanResults } from "@thorium/.server/systems/SensorScanSystem";
import { checkSystemStability } from "@thorium/utils/.server/ship/checkSystemStability";
import { getShipSystem } from "@thorium/utils/.server/ship/getShipSystem";
import { Entity } from "@thorium/utils/ecs";
import { type scanRecord, scanTypes } from "@thorium/utils/flags/scanTypes";
import { fromDate } from "dot-beat-time";
import { produce } from "immer";
import z from "zod";

export const sensors = t.router({
	get: t.procedure
		.input(z.object({ shipId: z.number() }))
		.filter((publish: { shipId: number; systemId: number }, { input }) => {
			if (publish && publish.shipId !== input.shipId) return false;
			return true;
		})
		.autoPublish(
			["isSensors"],
			(entity) =>
				entity.components.isShipSystem && {
					shipId: entity.components.isShipSystem.shipId,
					systemId: entity.id,
				},
		)

		.request(({ ctx, input }) => {
			const sensors = getShipSystem(ctx.ecs, {
				systemType: "sensors",
				shipId: input.shipId,
			});

			return {
				id: sensors.id,
				passiveRange: sensors.components.isSensors?.passiveRange || 10_000,
				activeRange: sensors.components.isSensors?.activeRange || 100_000,
				selectedContact: sensors.components.isSensors?.selectedContact || null,
				processedData: produce(sensors.components.isSensors?.processedData || [], (draft) => {
					draft.reverse();
				}),
			};
		}),
	scanResult: t.procedure
		.input(z.object({ shipId: z.number(), objectId: z.number() }))
		.filter((publish: { objectId: number; shipId: number }, { input }) => {
			if (publish && (publish.objectId !== input.objectId || publish.shipId !== input.shipId))
				return false;
			return true;
		})
		.autoPublish([], () => null)

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
		.autoPublish(["scan"], (entity) => {
			return entity.components.scan && { shipId: entity.components.scan?.parentId };
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
		.output(
			z.object({
				scanId: z.number(),
				shipId: z.number(),
				target: z.number(),
				type: scanTypes,
			}),
		)
		.meta({ event: true })
		.send(({ ctx, input }) => {
			const sensorsSystem = getShipSystem(ctx.ecs, {
				systemType: "sensors",
				shipId: input.shipId,
			});
			checkSystemStability(sensorsSystem, "Failed to start scanning");

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
			return { ...input, scanId: scanEntity.id };
		}),
	scanCancel: t.procedure
		.input(
			z.object({
				scanId: z.number(),
			}),
		)
		.output(
			z.object({
				scanId: z.number(),
				shipId: z.number().optional(),
			}),
		)
		.meta({ event: true })
		.send(({ ctx, input }) => {
			const shipId = ctx.ecs.getEntityById(input.scanId)?.components.scan?.parentId;
			if (shipId) {
				const sensorsSystem = getShipSystem(ctx.ecs, {
					systemType: "sensors",
					shipId,
				});
				checkSystemStability(sensorsSystem, "Failed to cancel scanning");
			}
			ctx.flight?.ecs.removeEntityById(input.scanId);
			if (shipId) {
				pubsub.publish.sensors.scans({ shipId });
			}
			return { scanId: input.scanId, shipId };
		}),
	selectContact: t.procedure
		.input(z.object({ shipId: z.number(), contactId: z.number().nullable() }))
		.output(z.object({ shipId: z.number(), contactId: z.number().nullable() }))
		.meta({ event: true })
		.send(({ ctx, input }) => {
			const sensors = getShipSystem(ctx.ecs, {
				systemType: "sensors",
				shipId: input.shipId,
			});
			sensors.updateComponent("isSensors", {
				selectedContact: input.contactId,
			});
			pubsub.publish.sensors.get({
				shipId: input.shipId,
				systemId: sensors.id,
			});
			return input;
		}),

	sendProcessedData: t.procedure
		.input(
			z.object({
				shipId: z.number(),
				data: z.string(),
				flash: z.boolean().optional(),
			}),
		)
		.output(
			z.object({
				shipId: z.number(),
				data: z.string(),
				flash: z.boolean().optional(),
			}),
		)
		.meta({ event: true, action: true })
		.send(({ ctx, input }) => {
			if (!input.data.trim()) throw new Error("Data cannot be empty");
			const sensorsSys = getShipSystem(ctx.ecs, {
				systemType: "sensors",
				shipId: input.shipId,
			});
			const sensors = sensorsSys.components.isSensors;

			if (!sensors) throw new Error("Sensors not found");

			sensorsSys.updateComponent("isSensors", {
				processedData: sensors.processedData.concat({
					timestamp: Date.now(),
					data: input.data,
				}),
			});

			if (input.flash) {
				// Get all stations that have the sensor scans or sensor grid card
				const stations =
					ctx.ecs
						.getEntityById(input.shipId)
						?.components.stationComplement?.stations.filter((s) =>
							s.cards.some(
								(c) => c.component === "LegacySensorScans" || c.component === "LegacySensorGrid",
							),
						) || [];

				for (const station of stations) {
					pubsub.publish.effects.sub({
						effect: { type: "flash" },
						shipId: input.shipId,
						station: station.name,
					});
				}
			}

			pubsub.publish.sensors.get({
				shipId: input.shipId,
				systemId: sensorsSys.id,
			});
			return input;
		}),

	removeProcessedData: t.procedure
		.input(z.object({ shipId: z.number(), timestamp: z.number() }))
		.send(({ ctx, input }) => {
			const sensorsSys = getShipSystem(ctx.ecs, {
				systemType: "sensors",
				shipId: input.shipId,
			});
			const sensors = sensorsSys.components.isSensors;

			if (!sensors) throw new Error("Sensors not found");

			sensorsSys.updateComponent("isSensors", {
				processedData: sensors.processedData.filter((p) => p.timestamp !== input.timestamp),
			});

			pubsub.publish.sensors.get({
				shipId: input.shipId,
				systemId: sensorsSys.id,
			});
		}),

	stream: t.procedure
		.input(z.object({ systemId: z.number().nullable(), shipId: z.number() }))
		.dataStream(({ ctx, input }) => {
			const set = new Set<Entity>();
			const systemId =
				input.systemId || ctx.ecs.getEntityById(input.shipId)?.components.position?.parentId;
			if (typeof systemId === "undefined") {
				return set;
			}
			for (const entity of ctx.ecs.componentCache.get("position") || []) {
				if (entity.components.position?.parentId === systemId) {
					set.add(entity);
				}
			}
			for (const entity of ctx.ecs.componentCache.get("scan") || []) {
				// TODO April 28, 2028 — make it so completed scans aren't sent anymore
				if (entity.components.scan?.parentId === input.shipId) {
					set.add(entity);
				}
			}
			return set;
		}),
});
