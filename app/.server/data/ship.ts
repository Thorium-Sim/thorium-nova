import type { DataContext } from "@thorium/.server/DataContext";
import { pubsub } from "@thorium/.server/init/pubsub";
import { t } from "@thorium/.server/init/t";
import { spawnShip } from "@thorium/.server/spawners/ship";
import { alertTypes } from "@thorium/ecs-components/shipAlerts";
import { destroyShip } from "@thorium/utils/.server/ship/collisionDamage";
import type { ECS, Entity } from "@thorium/utils/ecs";
import { randomNameGenerator } from "@thorium/utils/operations/randomNameGenerator";
import type { RNG } from "@thorium/utils/rng";
import {
	getCompletePositionFromOrbit,
	getObjectSystem,
} from "@thorium/utils/starmap/position";
import { Vector3 } from "three";
import z from "zod";

export const ship = t.router({
	get: t.procedure
		.input(
			z.union([
				z.object({ clientId: z.string() }),
				z.object({ shipId: z.number() }),
			]),
		)
		.filter(
			(publish: { shipId: number } | { clientId: string }, { ctx, input }) => {
				if (!publish) return true;
				if (
					"shipId" in publish &&
					publish.shipId !==
						("shipId" in input
							? input.shipId
							: ctx.getFlightClient(input.clientId)?.components.flightClient
									?.shipId)
				)
					return false;
				if (
					"clientId" in publish &&
					("clientId" in input
						? publish.clientId !== input.clientId
						: Object.values(ctx.flight?.clients || {}).some(
								(c) => c?.components.flightClient?.shipId === input.shipId,
							))
				)
					return false;
				return true;
			},
		)
		.autoPublish(["isShip", "flightClient"], (entity) => {
			if (entity.components.flightClient) {
				return { clientId: entity.components.flightClient.clientId };
			}
			if (entity.components.isShip) {
				return { shipId: entity.id };
			}
		})
		.request(({ ctx, input }) => {
			// TODO February 28, 2025 - Replace this with a more carefully crafted object
			const ship =
				ctx.ecs
					.getEntityById(
						"shipId" in input
							? input.shipId
							: ctx.getFlightClient(input.clientId)?.components.flightClient
									?.shipId || -1,
					)
					?.toJSON() || null;
			return ship;
		}),
	players: t.procedure
		.autoPublish(["isPlayerShip"], () => null)
		.request(({ ctx }) => {
			return (
				ctx.flight?.playerShips.map((ship) => {
					const systemId = ship.components.position?.parentId;
					const systemPosition = systemId
						? ctx.flight?.ecs.getEntityById(systemId)?.components.position ||
							null
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
		.input(
			z.object({ clientId: z.string(), playerShipId: z.number().optional() }),
		)
		.filter((publish: { shipId: number }, { ctx, input }) => {
			const shipId = ctx.getFlightClient(input.clientId)?.components
				.flightClient?.shipId;
			if (
				publish &&
				publish.shipId !== shipId &&
				publish.shipId !== input?.playerShipId
			)
				return false;
			return true;
		})
		.autoPublish(["position", "isShip"], (entity) =>
			entity.components.isPlayerShip ? { shipId: entity.id } : null,
		)
		.request(({ ctx, input }) => {
			const ship = ctx.flight?.ecs.getEntityById(
				input?.playerShipId ||
					ctx.getFlightClient(input.clientId)?.components.flightClient
						?.shipId ||
					-1,
			);
			if (!ship)
				return {
					id: input?.playerShipId || -1,
					name: "",
					registry: "",
					currentSystem: null,
					alertLevel: "5",
					systemPosition: {
						parentId: null,
						type: "interstellar",
						x: 0,
						y: 0,
						z: 0,
					},
				};
			const systemId = ship.components.position?.parentId;
			const systemPosition = systemId
				? ctx.flight?.ecs.getEntityById(systemId)?.components.position || null
				: null;
			const assets = ship.components.isShip!.assets;
			return {
				id: ship.id,
				name: ship.components.identity!.name,
				registry: ship.components.isShip!.registry,
				alertLevel: ship.components.isShip!.alertLevel,
				currentSystem: systemId || null,
				systemPosition,
				assets,
				isDestroyed: ship.components.isDestroyed,
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
					distance: {
						type: "number",
						helper:
							"How far to place the ship from the nearby entity in kilometers.",
					},
				};
			},
		})
		.input(
			z.object({
				template: z.object({ name: z.string(), pluginId: z.string() }),
				entityId: z.number().optional(),
				distance: z.number().optional(),
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
		.output(z.object({ id: z.number() }))
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
					flightMode: ctx.flight.mode,
				},
			);

			const { position, systemId } = getPosition(ctx.ecs, input);
			shipEntity.updateComponent("position", {
				...position,
				parentId: systemId,
				type: systemId ? "solar" : "interstellar",
			});

			extraEntities.forEach((s) => ctx.flight?.ecs.addEntity(s));
			ctx.flight?.ecs.addEntity(shipEntity);

			pubsub.publish.starmapCore.ships({
				systemId: shipEntity.components.position?.parentId || null,
			});
			return { id: shipEntity.id };
		}),
	move: t.procedure
		.meta({
			action: () => ({
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
			}),
		})
		.input(
			z.object({
				shipId: z.number(),
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
			}),
		)
		.send(({ ctx, input }) => {
			const entity = ctx.ecs.getEntityById(input.shipId);
			if (!entity) return;

			const { position, systemId } = getPosition(ctx.ecs, input);
			entity.updateComponent("position", {
				...position,
				parentId: systemId,
				type: systemId === null ? "interstellar" : "solar",
			});
			pubsub.publish.ship.player({ shipId: entity.id });
			pubsub.publish.ship.players();
		}),
	destroy: t.procedure
		.meta({ action: true })
		.input(z.object({ shipId: z.number() }))
		.send(({ ctx, input }) => {
			const ship = ctx.ecs.getEntityById(input.shipId);
			if (!ship) throw new Error("Ship not found");

			destroyShip(ship);
		}),
	shipAlerts: t.router({
		get: t.procedure
			.input(
				z.object({
					shipId: z.number(),
					types: z.array(alertTypes).optional(),
				}),
			)
			.filter((publish: { shipId: number }, { input }) => {
				if (publish && publish.shipId !== input.shipId) return false;
				return true;
			})
			.autoPublish(
				["shipAlerts"],
				(entity) => entity.components.isPlayerShip && { shipId: entity.id },
			)
			.request(({ ctx, input }) => {
				const ship = ctx.ecs.getEntityById(input.shipId);
				const allAlerts = ship?.components.shipAlerts?.alerts ?? [];
				const alerts = input.types
					? allAlerts.filter((a) => input.types!.includes(a.type))
					: allAlerts;
				return { alerts };
			}),
	}),
});

function getPosition(
	ecs: ECS,
	input:
		| { entityId: number; distance?: number }
		| {
				position?:
					| {
							parentId:
								| number
								| {
										name: string;
										pluginId: string;
								  }
								| null;
							x: number;
							y: number;
							z: number;
					  }
					| undefined;
		  },
) {
	// Set the position of the ship
	let position = { x: 0, y: 0, z: 0 };
	let systemId: number | null = null;
	let object: Entity | null = null;
	if ("entityId" in input) {
		// This ship is being attached to a specific object in space.
		object = ecs.getEntityById(input.entityId || -1);
		if (!object) throw new Error("No object found.");
		position = getNearbyEntityPoint(object, ecs.rng, input.distance);
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
			const solarSystems = ecs.componentCache.get("isSolarSystem") || [];
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

	return { position, systemId };
}
const objectPosition = new Vector3();
function getNearbyEntityPoint(
	objectEntity: Entity,
	rng: RNG,
	distance?: number,
) {
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

	const distanceVector = new Vector3(
		objectScale * 2 + rng.next() * objectScale,
		0,
		objectScale * 2 + rng.next() * objectScale,
	);
	if (distance) {
		distanceVector.normalize().multiplyScalar(distance);
	}
	return {
		x: objectPosition.x + distanceVector.x,
		y: objectPosition.y,
		z: objectPosition.z + distanceVector.z,
	};
}
