import { z } from "zod";
import { t } from "@thorium/.server/init/t";
import { getShipSystem } from "@thorium/utils/.server/ship/getShipSystem";
import type { isDestroyed } from "@thorium/ecs-components/isDestroyed";

type IsDestroyed = Zod.infer<typeof isDestroyed>;

export const sensors = t.router({
	get: t.procedure
		.filter((publish: { shipId: number; systemId: number }, { ctx }) => {
			if (publish && publish.shipId !== ctx.ship?.id) return false;
			return true;
		})
		.request(({ ctx }) => {
			const sensors = getShipSystem(ctx, {
				systemType: "sensors",
			});

			return {
				id: sensors.id,
				passiveRange: sensors.components.isSensors?.passiveRange || 10_000,
				activeRange: sensors.components.isSensors?.activeRange || 100_000,
				database: sensors.components.isSensors?.resultsDatabase,
			};
		}),
	/** Includes all the ship within passive range of the ship */
	ships: t.procedure
		.filter((publish: { systemId: number | null }, { input, ctx }) => {
			const systemId = ctx.ship?.components.position?.parentId || null;
			if (!publish) return true;
			if (!publish.systemId && !systemId) return true;
			if (publish.systemId === systemId) return true;
			return false;
		})
		.request(({ ctx, input }) => {
			if (!ctx.flight) return [];
			const shipEntities = ctx.flight.ecs.componentCache.get("isShip") || [];
			const data: {
				id: number;
				modelUrl?: string;
				logoUrl?: string;
				size: number;
				isDestroyed?: IsDestroyed;
			}[] = [];
			const shipPosition = ctx.ship?.components.position;
			if (!shipPosition) return [];
			const systemId = shipPosition.parentId || null;

			const sensors = getShipSystem(ctx, {
				systemType: "sensors",
			});
			const passiveRange = sensors.components.isSensors?.passiveRange;
			if (!passiveRange) return [];

			for (const { components, id } of shipEntities) {
				const position = components.position;
				if (!position) continue;
				const distance = Math.hypot(
					shipPosition.x - position.x,
					shipPosition.y - position.y,
					shipPosition.z - position.z,
				);
				if (
					components.isShip &&
					((typeof systemId === "number" &&
						components.position?.parentId === systemId) ||
						(systemId === undefined &&
							components.position?.type === "interstellar")) &&
					distance <= passiveRange
				) {
					data.push({
						id,
						modelUrl: components.isShip.assets.model,
						logoUrl: components.isShip.assets.logo,
						size: components.size?.length || 50,
						isDestroyed: components.isDestroyed,
					});
				}
			}

			return data;
		}),
	stream: t.procedure
		.input(z.object({ systemId: z.number().nullable() }))
		.dataStream(({ ctx, input, entity }) => {
			if (!entity) return false;
			const systemId =
				input?.systemId || ctx.ship?.components.position?.parentId;
			if (typeof systemId === "undefined") {
				return false;
			}
			return Boolean(
				(entity.components.position &&
					entity.components.position.parentId === systemId) ||
					(entity.components.scan &&
						entity.components.scan.parentId === ctx.ship?.id),
			);
		}),
});
