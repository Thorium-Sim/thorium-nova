import { t } from "@server/init/t";
import { pubsub } from "@server/init/pubsub";
import { spawnShip } from "@server/spawners/ship";
import { z } from "zod";
import { randomNameGenerator } from "@server/utils/randomNameGenerator";

export const ship = t.router({
	get: t.procedure
		.filter((publish: { shipId: number } | { clientId: string }, { ctx }) => {
			if (!publish) return true;
			if ("shipId" in publish && publish.shipId !== ctx.flightClient?.shipId)
				return false;
			if ("clientId" in publish && publish.clientId !== ctx.id) return false;
			return true;
		})
		.request(({ ctx }) => {
			const ship = ctx.ship?.toJSON() || null;
			return ship;
		}),
	players: t.procedure.request(({ ctx }) => {
		return (
			ctx.flight?.playerShips.map((ship) => {
				const systemId = ship.components.position?.parentId;
				const systemPosition = systemId
					? ctx.flight?.ecs.getEntityById(systemId)?.components.position || null
					: null;
				return {
					id: ship.id,
					name: ship.components.identity?.name,
					currentSystem: systemId || null,
					systemPosition,
					stations: ship.components.stationComplement?.stations || [],
				};
			}) || []
		);
	}),
	player: t.procedure
		.filter((publish: { shipId: number }, { ctx }) => {
			if (publish && publish.shipId !== ctx.ship?.id) return false;
			return true;
		})
		.request(({ ctx }) => {
			if (!ctx.ship) throw new Error("Cannot find ship");
			const systemId = ctx.ship.components.position?.parentId;
			const systemPosition = systemId
				? ctx.flight?.ecs.getEntityById(systemId)?.components.position || null
				: null;
			return {
				id: ctx.ship.id,
				currentSystem: systemId || null,
				systemPosition,
			};
		}),
	spawn: t.procedure
		.input(
			z.object({
				template: z.object({ id: z.string(), pluginName: z.string() }),
				systemId: z.number().nullable(),
				position: z.object({
					x: z.number(),
					y: z.number(),
					z: z.number(),
				}),
			}),
		)
		.send(({ ctx, input }) => {
			const shipTemplate = ctx.server.plugins
				.find((plugin) => plugin.name === input.template.pluginName)
				?.aspects.ships.find((ship) => ship.name === input.template.id);

			if (!shipTemplate) throw new Error("Ship template not found.");

			const { ship: shipEntity, extraEntities } = spawnShip(ctx, shipTemplate, {
				// TODO: August 20, 2022 - Generate a name for this ship somehow
				name: randomNameGenerator(),
				position: {
					x: input.position.x,
					y: input.position.y,
					z: input.position.z,
					type: typeof input.systemId === "number" ? "solar" : "interstellar",
					parentId: input.systemId,
				},
			});
			extraEntities.forEach((s) => ctx.flight?.ecs.addEntity(s));
			ctx.flight?.ecs.addEntity(shipEntity);
			pubsub.publish.starmapCore.ships({ systemId: input.systemId || null });
		}),
});
