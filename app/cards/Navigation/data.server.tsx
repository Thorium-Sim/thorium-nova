import type { position } from "@thorium/ecs-components/position";
import { type ECS, Entity } from "@thorium/utils/ecs";
import { getOrbitPosition } from "@thorium/utils/starmap/getOrbitPosition";
import { matchSorter } from "match-sorter";
import { t } from "@thorium/.server/init/t";
import { z } from "zod";
import { pubsub } from "@thorium/.server/init/pubsub";
import {
	getCompletePositionFromOrbit,
	getObjectOffsetPosition,
	getObjectSystem,
} from "@thorium/utils/starmap/position";
import type { DataContext } from "@thorium/.server/DataContext";
import { getClassification } from "@thorium/cards/Navigation/getObjectClassification.server";

type Waypoint = {
	id: number;
	name: string;
	objectId?: number;
	permanent: boolean;
	isActive: boolean;
	position: z.infer<typeof position>;
	systemPosition: z.infer<typeof position> | null;
};

export const navigation = t.router({
	ship: t.procedure
		.input(z.object({ shipId: z.number() }))
		.filter((publish: { shipId: number }, { input }) => {
			if (publish && "shipId" in publish && publish.shipId !== input.shipId)
				return false;

			return true;
		})
		.autoPublish(
			["isShip", "size", "identity", "position"],
			(entity) => entity.components.isShip && { shipId: entity.id },
		)
		.request(({ ctx, input }) => {
			const ship = ctx.ecs.getEntityById(input.shipId);
			if (!ship) throw new Error("No ship assigned");
			return {
				id: ship.id,
				name: ship.components.identity?.name,
				position: ship.components.position,
				icon: ship.components.isShip?.assets.logo,
				size: ship.components.size?.length || 350,
			};
		}),
	object: t.procedure
		.input(z.object({ shipId: z.number(), objectId: z.number().optional() }))
		.filter((publish: { shipId: number }, { ctx, input }) => {
			if (publish && publish.shipId !== input.shipId) return false;
			return true;
		})
		// No need to auto-publish this one.
		.autoPublish([], () => null)

		.request(({ ctx, input }) => {
			const ship = ctx.ecs.getEntityById(input.shipId);
			if (!ship) throw new Error("Ship not found");

			const shipSolarSystem = getObjectSystem(ship);
			const object = ctx.ecs.getEntityById(input?.objectId || -1);

			if (!object)
				return {
					object: null,
					objectSystem: null,
					shipSystem: shipSolarSystem?.components.position
						? {
								id: shipSolarSystem?.id,
								...shipSolarSystem?.components.position,
							}
						: null,
				};
			const objectSystem = getObjectSystem(object);
			const position =
				object.components.position ||
				(object.components.satellite
					? getOrbitPosition(object.components.satellite)
					: undefined);
			return {
				object: {
					position,
					name: object.components.identity?.name,
					classification: getClassification(object),
					type: object.components.isShip
						? "ship"
						: object.components.isPlanet
							? "planet"
							: object.components.isStar
								? "star"
								: object.components.isSolarSystem
									? "solarSystem"
									: "unknown",
					vanity: object.components.isShip?.assets.vanity,
					hue: object.components.isStar?.hue,
					isWhite: object.components.isStar?.isWhite,
					cloudMapAsset: object.components.isPlanet?.cloudMapAsset,
					ringMapAsset: object.components.isPlanet?.ringMapAsset,
					textureMapAsset: object.components.isPlanet?.textureMapAsset,
				},
				objectSystem: objectSystem?.components.position
					? { id: objectSystem?.id, ...objectSystem.components.position }
					: null,
				shipSystem: shipSolarSystem?.components.position
					? { id: shipSolarSystem?.id, ...shipSolarSystem.components.position }
					: null,
			};
		}),

	search: t.procedure
		.input(z.object({ query: z.string() }))
		// No need to auto-publish this one.
		.autoPublish([], () => null)
		.request(({ ctx, input }) => {
			const { query } = input;

			const matchedEntities = [
				...(ctx.ecs.componentCache.get("isStar") || []),
				...(ctx.ecs.componentCache.get("isPlanet") || []),
				...(ctx.ecs.componentCache.get("isSolarSystem") || []),
			];
			// Get all of the planet, star, and solar system entities that match the query.
			const matchItems = matchSorter(
				matchedEntities.map((m) => {
					let position = m.components.position;
					if (!position) {
						const { x, y, z } = getCompletePositionFromOrbit(m);
						const parentId = getObjectSystem(m)?.id || null;
						position = {
							x,
							y,
							z,
							type: m.components.isSolarSystem ? "interstellar" : "solar",
							parentId: m.components.isSolarSystem ? null : parentId,
						};
					}
					return {
						...m,
						type: m.components.isSolarSystem
							? "solar"
							: m.components.isPlanet
								? "planet"
								: m.components.isShip
									? "ship"
									: "star",
						name: m.components.identity!.name,
						description: m.components.identity?.description,
						temperature: m.components.temperature?.temperature,
						spectralType: m.components.isStar?.spectralType,
						classification: m.components.isPlanet?.classification,
						mass:
							m.components.isStar?.solarMass ||
							m.components.isPlanet?.terranMass,
						population: m.components.population?.count,
						position,
					} as const;
				}) || [],
				query,
				{
					keys: [
						"name",
						"description",
						"temperature",
						"spectralType",
						"classification",
						"mass",
						"population",
					],
				},
			).map((m) => ({
				// TODO Aug 1 2022 - Add in a distance calculation.
				id: m.id,
				name: m.name,
				position: m.position,
				type: m.type,
			}));

			return matchItems;
		}),
	stream: t.procedure
		.input(z.object({ shipId: z.number() }))
		.dataStream(({ entity, input }) => {
			return Boolean(entity?.components.position && entity.id === input.shipId);
		}),
});

export const waypoints = t.router({
	all: t.procedure
		.input(
			z.object({
				shipId: z.number(),
				active: z.boolean(),
				systemId: z.union([z.literal("all"), z.number(), z.null()]),
			}),
		)
		.filter((publish: { shipId: number } | null, { input }) => {
			if (publish && input.shipId !== publish.shipId) return false;
			return true;
		})
		.autoPublish(
			["isWaypoint", "identity", "position"],
			(entity) =>
				entity.components.isWaypoint && {
					shipId: entity.components.isWaypoint.assignedShipId,
				},
		)
		.request(({ ctx, input: { shipId, systemId, active } }) => {
			const waypoints: Waypoint[] = [];
			for (const waypoint of ctx.ecs.componentCache.get("isWaypoint") || []) {
				if (
					waypoint.components.isWaypoint?.assignedShipId === shipId &&
					(systemId === "all" ||
						waypoint.components.position?.parentId === systemId)
				) {
					if (active && !waypoint.components.isWaypoint.isActive) continue;
					if (waypoint.components.position) {
						const systemPosition =
							ctx.flight?.ecs.getEntityById(
								waypoint.components.position.parentId || -1,
							)?.components.position || null;
						waypoints.push({
							id: waypoint.id,
							name: waypoint.components.identity?.name || "",
							objectId: waypoint.components.isWaypoint?.attachedObjectId,
							position: waypoint.components.position,
							permanent: waypoint.components.isWaypoint.permanent,
							isActive: waypoint.components.isWaypoint.isActive,
							systemPosition,
						});
					}
				}
			}

			return waypoints;
		}),
	spawn: t.procedure
		.meta({
			action: (ctx: DataContext) => {
				return {
					position: {
						name: "Position",
						type: "starmapCoordinates",
						helper:
							"A specific point in space to place the waypoint. Use as an alternative to Waypoint Entity.",
					},
					entityId: {
						name: "Waypoint Entity",
						helper:
							"The entity to attach the waypoint to. This option is preferred.",
					},
				};
			},
			event: true,
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
				permanent: z.boolean().optional(),
				active: z.boolean().optional(),
				tags: z.array(z.string()).optional(),
			}),
		)
		.output(
			z.object({
				waypointId: z.number(),
			}),
		)
		.send(({ ctx, input }) => {
			if (!ctx.flight) throw new Error("No flight in progress");
			const ship = ctx.flight.ecs.getEntityById(input.shipId);
			if (!ship) throw new Error("No ship selected.");
			const shipId = ship.id;
			let position = { x: 0, y: 0, z: 0 };
			let systemId: number | null = null;
			let object: Entity | null = null;
			if ("entityId" in input) {
				// This waypoint is being attached to a specific object in space.
				object = ctx.ecs.getEntityById(input.entityId || -1);
				if (!object) throw new Error("No object found.");

				const targetParentId = ship.components.position
					? ship.components.position.parentId
					: ship.components.satellite?.parentId || null;
				const targetPosition = {
					parentId: targetParentId,
					type: targetParentId ? "solar" : "interstellar",
					...(ship.components.position || getCompletePositionFromOrbit(ship)),
				} as const;
				position = getObjectOffsetPosition(
					object,
					targetPosition,
					(ship.components.size?.length || 1 / 1000) * 2,
				);
				const sys = getObjectSystem(object);
				systemId = sys?.id ?? null;
				if (sys?.id === object.id) systemId = null;
				for (const maybeWaypoint of ctx.ecs.componentCache.get("isWaypoint") ||
					[]) {
					if (
						maybeWaypoint.components.isWaypoint?.assignedShipId === shipId &&
						maybeWaypoint.components.isWaypoint?.attachedObjectId === object?.id
					) {
						maybeWaypoint.updateComponent("position", {
							...position,
							type: systemId ? "solar" : "interstellar",
							parentId: systemId,
						});
						if (input.tags && input.tags.length > 0) {
							maybeWaypoint.updateComponent("tags", {
								tags: [
									...(maybeWaypoint.components.tags?.tags || []),
									...input.tags,
								],
							});
						}
						pubsub.publish.waypoints.all({
							shipId,
						});
						return { waypointId: maybeWaypoint.id };
					}
				}
			} else if ("position" in input && input.position) {
				// This waypoint is just being plopped at some random point in space.
				position = input.position;
				const parentId = input.position.parentId;
				if (parentId && typeof parentId === "object") {
					// This waypoint is probably defined in a timeline action, so we need
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

			if (input.active) {
				deactivateWaypoints(ctx.ecs, shipId);
			}
			const newWaypoint = new Entity();
			newWaypoint.addComponent("isWaypoint", {
				assignedShipId: shipId,
				attachedObjectId: object?.id,
				permanent: input.permanent,
				isActive: input.active,
			});
			// If we have an object, set the name to the name of that object
			if (object?.components.identity?.name) {
				// TODO: INTL in the server here.
				newWaypoint.addComponent("identity", {
					name: `${object.components.identity.name} Waypoint`,
				});
			} else {
				// Count up the highest waypoint count and use that.
				let waypointNum = 1;
				for (const waypoint of ctx.ecs.componentCache.get("isWaypoint") || []) {
					if (waypoint.components.isWaypoint?.assignedShipId === shipId) {
						const nameWords =
							waypoint.components.identity?.name.split(" ") || [];
						const num = Number.parseInt(nameWords[nameWords.length - 1], 10);
						if (num && num >= waypointNum) waypointNum = num + 1;
					}
				}
				newWaypoint.addComponent("identity", {
					name: `Waypoint ${waypointNum}`,
				});
			}
			newWaypoint.addComponent("position", {
				...position,
				parentId: systemId,
				type: systemId ? "solar" : "interstellar",
			});

			if (input.tags && input.tags.length > 0) {
				newWaypoint.addComponent("tags", {
					tags: input.tags,
				});
			}

			ctx.flight.ecs.addEntity(newWaypoint);

			pubsub.publish.waypoints.all({
				shipId,
			});

			return { waypointId: newWaypoint.id };
		}),
	activate: t.procedure
		.meta({ action: true, event: true })
		.input(z.object({ waypointId: z.number() }))
		.output(z.object({ waypointId: z.number() }))
		.send(({ ctx, input }) => {
			const waypoint = ctx.ecs.getEntityById(input.waypointId);
			if (!waypoint?.components.isWaypoint)
				throw new Error("Waypoint not found.");
			deactivateWaypoints(
				ctx.ecs,
				waypoint.components.isWaypoint.assignedShipId,
			);
			waypoint.updateComponent("isWaypoint", { isActive: true });
			pubsub.publish.waypoints.all({
				shipId: waypoint.components.isWaypoint.assignedShipId,
			});
			return { waypointId: input.waypointId };
		}),
	deactivate: t.procedure
		.meta({ action: true, event: true })
		.input(z.object({ shipId: z.number() }))
		.output(z.object({ shipId: z.number() }))
		.send(({ ctx, input }) => {
			deactivateWaypoints(ctx.ecs, input.shipId);
			pubsub.publish.waypoints.all({
				shipId: input.shipId,
			});
			return { shipId: input.shipId };
		}),
	delete: t.procedure
		.meta({ action: true, event: true })
		.input(
			z.object({
				shipId: z.number(),
				waypointId: z.number(),
				overridePermanent: z.boolean().optional(),
			}),
		)
		.send(({ ctx, input: { waypointId, shipId, overridePermanent } }) => {
			const waypoint = ctx.ecs.getEntityById(waypointId);
			if (!waypoint) throw new Error("No waypoint found.");
			if (waypoint.components.isWaypoint?.assignedShipId !== shipId)
				throw new Error("Waypoint is not assigned to this ship.");
			if (waypoint.components.isWaypoint.permanent && !overridePermanent) {
				throw new Error("Waypoint cannot be deleted.");
			}
			ctx.ecs.removeEntity(waypoint);
			pubsub.publish.waypoints.all({
				shipId,
			});
		}),
});

function deactivateWaypoints(ecs: ECS, shipId: number) {
	for (const waypoint of ecs.componentCache.get("isWaypoint") || []) {
		if (waypoint.components.isWaypoint?.assignedShipId === shipId) {
			waypoint.updateComponent("isWaypoint", {
				isActive: false,
			});
		}
	}
	pubsub.publish.waypoints.all({
		shipId,
	});
}
