import { t } from "@server/init/t";
import { pubsub } from "@server/init/pubsub";
import { spawnShip } from "@server/spawners/ship";
import { z } from "zod";
import { randomNameGenerator } from "@server/utils/randomNameGenerator";
import type { Entity } from "@server/utils/ecs";
import {
	getCompletePositionFromOrbit,
	getObjectSystem,
} from "@server/utils/position";
import type { DataContext } from "@server/utils/types";
import { Vector3 } from "three";

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
		.meta({
			action: (ctx: DataContext) => {
				return {
					template: {
						name: "Ship Template",
						type: "shipTemplate",
						helper: "Which type of ship will be spawned.",
					},
					position: {
						name: "Position",
						type: "starmapCoordinates",
						helper:
							"A specific point in space to place the ship. Use as an alternative to Nearby Entity.",
					},
					entityId: {
						name: "Nearby Entity",
						helper:
							"Place the ship nearby this entity. This option is preferred.",
					},
				};
			},
		})
		.input(
			z.object({
				template: z.object({ name: z.string(), pluginId: z.string() }),
				entityId: z.number().optional(),
				position: z
					.object({
						parentId: z
							.union([
								z.number(),
								z.object({ name: z.string(), pluginId: z.string() }),
							])
							.nullable(),
						x: z.number(),
						y: z.number(),
						z: z.number(),
					})
					.optional(),
				tags: z.array(z.string()).optional(),
			}),
		)
		.send(async ({ ctx, input }) => {
			if (!ctx.flight) throw new Error("Flight not found.");

			const shipTemplate = ctx.server.plugins
				.find((plugin) => plugin.name === input.template.pluginId)
				?.aspects.ships.find((ship) => ship.name === input.template.name);

			if (!shipTemplate) throw new Error("Ship template not found.");

			const { ship: shipEntity, extraEntities } = await spawnShip(
				ctx,
				shipTemplate,
				{
					// TODO: August 20, 2022 - Generate a name for this ship somehow
					name: randomNameGenerator(),
					tags: input.tags,
				},
			);
			extraEntities.forEach((s) => ctx.flight?.ecs.addEntity(s));
			ctx.flight?.ecs.addEntity(shipEntity);

			// Set the position of the ship
			let position = { x: 0, y: 0, z: 0 };
			let systemId: number | null = null;
			let object: Entity | undefined = undefined;
			if ("entityId" in input) {
				// This ship is being attached to a specific object in space.
				object = ctx.flight?.ecs.entities.find((e) => e.id === input.entityId);
				if (!object) throw new Error("No object found.");
				position = getNearbyEntityPoint(object);
				const sys = getObjectSystem(object);
				systemId = sys?.id ?? null;
				if (sys?.id === object.id) systemId = null;
			} else if ("position" in input && input.position) {
				// This ship is just being plopped at some random point in space.
				position = input.position;
				const parentId = input.position.parentId;
				if (parentId && typeof parentId === "object") {
					// This ship is probably defined in a timeline action, so we need
					// to find which system matches the name.
					const solarSystems =
						ctx.flight.ecs.componentCache.get("isSolarSystem") || [];
					for (const entity of solarSystems) {
						if (entity.components.identity?.name === parentId.name) {
							systemId = entity.id;
							break;
						}
					}
				} else {
					systemId = parentId;
				}
			} else {
				throw new Error("Either position or entityId are required");
			}
			shipEntity.updateComponent("position", {
				...position,
				parentId: systemId,
				type: systemId ? "solar" : "interstellar",
			});

			pubsub.publish.starmapCore.ships({
				systemId: shipEntity.components.position?.parentId || null,
			});
		}),
});

const objectPosition = new Vector3();
function getNearbyEntityPoint(objectEntity: Entity) {
	if (objectEntity.components.position) {
		objectPosition.set(
			objectEntity.components.position.x,
			objectEntity.components.position.y,
			objectEntity.components.position.z,
		);
	} else {
		objectPosition.copy(getCompletePositionFromOrbit(objectEntity));
	}

	const objectScale =
		objectEntity.components?.isPlanet?.radius ||
		(objectEntity.components.size &&
			Math.max(
				objectEntity.components.size.height,
				objectEntity.components.size.length,
				objectEntity.components.size.width,
			) / 1000) ||
		1;

	const distanceVector = {
		x: objectScale * 2 + (Math.random() - 0.5) * objectScale,
		y: 0,
		z: objectScale * 2 + (Math.random() - 0.5) * objectScale,
	};
	return {
		x: objectPosition.x + distanceVector.x,
		y: objectPosition.y,
		z: objectPosition.z + distanceVector.z,
	};
}
