import { t } from "@server/init/t";
import { pubsub } from "@server/init/pubsub";
import { matchSorter } from "match-sorter";
import type ShipPlugin from "@server/classes/Plugins/Ship";
import { Entity } from "@server/utils/ecs";
import type { Coordinates } from "@server/utils/unitTypes";
import { z } from "zod";
import {
	getObjectOffsetPosition,
	getObjectSystem,
} from "@server/utils/position";
import type { isDestroyed } from "@server/components/isDestroyed";
import type { DataContext } from "@server/utils/types";
import { Vector3 } from "three";

type IsDestroyed = Zod.infer<typeof isDestroyed>;

const behavior = z.enum([
	"hold",
	"patrol",
	"wander",
	"attack",
	"defend",
	"avoid",
]);

export const starmapCore = t.router({
	systems: t.procedure.request(({ ctx }) => {
		if (!ctx.flight) return [];
		const data = ctx.flight.ecs.entities.reduce(
			(prev: Pick<Entity, "components" | "id">[], { components, id }) => {
				if (components.isSolarSystem) prev.push({ components, id });
				return prev;
			},
			[],
		);
		return data;
	}),
	system: t.procedure
		.input(z.object({ systemId: z.number().nullish() }))
		.request(({ ctx, input }) => {
			if (!ctx.flight) throw new Error("No flight in progress");
			if (input?.systemId === null || input?.systemId === undefined)
				throw new Error("No system id provided");
			const data = ctx.flight.ecs.getEntityById(input.systemId);
			if (!data?.components.isSolarSystem)
				throw new Error("Not a solar system");
			return { id: data.id, components: data.components };
		}),
	/** Includes all the things in a system that isn't a ship */
	entities: t.procedure
		.input(z.object({ systemId: z.number().nullable() }))
		.request(({ ctx, input }) => {
			if (!ctx.flight) return [];
			if (input?.systemId === null || input?.systemId === undefined) return [];
			const data = ctx.flight.ecs.entities.reduce(
				(prev: Pick<Entity, "components" | "id">[], { components, id }) => {
					if (components.isShip || components.isTorpedo) return prev;
					if (
						components.position?.parentId === input.systemId ||
						components.satellite?.parentId === input.systemId
					)
						prev.push({ components, id });
					return prev;
				},
				[],
			);
			return data;
		}),
	/** Includes all the ship in a system or interstellar space */
	ships: t.procedure
		.input(z.object({ systemId: z.number().nullable() }))
		.filter((publish: { systemId: number | null }, { input }) => {
			if (!publish) return true;
			if (!publish.systemId && !input.systemId) return true;
			if (publish.systemId === input.systemId) return true;
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
			for (const { components, id } of shipEntities) {
				if (
					components.isShip &&
					((typeof input?.systemId === "number" &&
						components.position?.parentId === input.systemId) ||
						(input?.systemId === undefined &&
							components.position?.type === "interstellar"))
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
	torpedos: t.procedure
		.input(z.object({ systemId: z.number().nullable() }))
		.filter((publish: { systemId: number | null }, { input }) => {
			if (!publish) return true;
			if (!publish.systemId && !input.systemId) return true;
			if (publish.systemId === input.systemId) return true;
			return false;
		})
		.request(({ ctx, input }) => {
			if (!ctx.flight) return [];
			const torpedoEntities =
				ctx.flight.ecs.componentCache.get("isTorpedo") || [];
			const data: {
				id: number;
				color: string;
				isDestroyed?: IsDestroyed;
			}[] = [];
			for (const { components, id } of torpedoEntities) {
				if (
					components.isTorpedo &&
					((typeof input?.systemId === "number" &&
						components.position?.parentId === input.systemId) ||
						(input?.systemId === undefined &&
							components.position?.type === "interstellar"))
				) {
					if (
						components.isDestroyed &&
						components.isDestroyed.timer > components.isDestroyed.timeToDestroy
					)
						continue;
					data.push({
						id,
						color: components.isTorpedo.color,
						isDestroyed: components.isDestroyed,
					});
				}
			}
			return data;
		}),
	/** Useful for fetching a single ship when following that ship */
	ship: t.procedure
		.input(z.object({ shipId: z.number().optional().nullish() }))
		.filter((publish: { shipId: number | null }, { input }) => {
			if (!input.shipId) return true;
			if (publish && publish.shipId !== input.shipId) return false;

			return true;
		})
		.request(({ ctx, input }) => {
			if (!input.shipId) return null;
			if (!ctx.flight) return null;

			const entity = ctx.flight.ecs.getEntityById(input.shipId);
			if (!entity) return null;
			return {
				id: entity.id,
				systemId: entity.components.position?.parentId,
				behavior: entity.components.shipBehavior,
			};
		}),
	debugSpheres: t.procedure
		.input(z.object({ systemId: z.number().nullable() }))
		.filter((publish: { systemId: number | null }, { input }) => {
			if (publish && publish.systemId !== input.systemId) return false;
			return true;
		})
		.request(({ ctx, input }) => {
			if (!ctx.flight) return [];
			const data = ctx.flight.ecs.entities.reduce(
				(
					prev: {
						id: number;
					}[],
					{ components, id },
				) => {
					if (components.debugSphere) {
						if (
							(typeof input?.systemId === "number" &&
								components.position?.parentId === input.systemId) ||
							(input?.systemId === undefined &&
								components.position?.type === "interstellar")
						) {
							prev.push({
								id,
							});
						}
					}
					return prev;
				},
				[],
			);
			return data;
		}),
	spawnSearch: t.procedure
		.input(z.object({ query: z.string(), allPlugins: z.boolean().optional() }))
		.request(({ ctx, input }) => {
			if (!input.allPlugins && !ctx.flight) return [];
			const shipTemplates = ctx.server.plugins
				.filter((p) =>
					input.allPlugins ? true : ctx.flight?.pluginIds.includes(p.id),
				)
				.reduce((acc: ShipPlugin[], plugin) => {
					return acc.concat(plugin.aspects.ships);
				}, []);

			// TODO August 20, 2022: Add faction here too
			return matchSorter(shipTemplates, input.query, {
				keys: ["name", "description", "category", "tags"],
			})
				.slice(0, 10)
				.map(({ pluginName, name, category, assets: { vanity } }) => ({
					id: name,
					pluginName,
					name,
					category,
					vanity,
				}));
		}),
	autopilot: t.procedure
		.input(z.object({ systemId: z.number().nullable() }))
		.filter((publish: { systemId: number | null }, { input }) => {
			if (publish && publish.systemId !== input.systemId) return false;
			return true;
		})
		.request(({ ctx, input }) => {
			const autopilotSystem = ctx.flight?.ecs.systems.find(
				(system) => system.constructor.name === "AutoThrustSystem",
			);
			const ships = autopilotSystem?.entities.filter(
				(entity) => entity.components.position?.parentId === input.systemId,
			);

			type AutopilotInfo = {
				forwardAutopilot: boolean;
				destinationName: string;
				destinationPosition: Coordinates<number> | null;
				destinationSystemPosition: Coordinates<number> | null;
				locked: boolean;
			};

			return (
				ships?.reduce((acc: { [id: number]: AutopilotInfo }, ship) => {
					const waypointId = ship.components.autopilot?.destinationWaypointId;
					let destinationName = "";
					let waypoint: Entity | null | undefined;
					if (typeof waypointId === "number") {
						waypoint = ctx.flight?.ecs.getEntityById(waypointId);
						destinationName =
							waypoint?.components.identity?.name
								.replace(" Waypoint", "")
								.trim() || "";
					}
					const waypointParentId = waypoint?.components.position?.parentId;

					const waypointSystemPosition =
						typeof waypointParentId === "number"
							? ctx.flight?.ecs.getEntityById(waypointParentId)?.components
									.position || null
							: null;

					acc[ship.id] = {
						forwardAutopilot: !!ship.components.autopilot?.forwardAutopilot,
						destinationName,
						destinationPosition:
							ship.components.autopilot?.desiredCoordinates || null,
						destinationSystemPosition: waypointSystemPosition,
						locked: !!ship.components.autopilot?.desiredCoordinates,
					};
					return acc;
				}, {}) || {}
			);
		}),
	setDestinations: t.procedure
		.input(
			z.object({
				ships: z
					.object({
						id: z.number(),
						position: z.object({ x: z.number(), y: z.number(), z: z.number() }),
						systemId: z.number().nullable(),
					})
					.array(),
			}),
		)
		.send(({ ctx, input }) => {
			const systemIds = new Set<number | null>();

			input.ships.forEach((ship) => {
				const entity = ctx.flight?.ecs.getEntityById(ship.id);
				entity?.updateComponent("autopilot", {
					desiredCoordinates: ship.position,
					desiredSolarSystemId: ship.systemId,
				});
				entity?.updateComponent("shipBehavior", {
					destination: {
						parentId: ship.systemId,
						x: ship.position.x,
						y: ship.position.y,
						z: ship.position.z,
					},
					target: {
						parentId: ship.systemId,
						x: ship.position.x,
						y: ship.position.y,
						z: ship.position.z,
					},
				});
				if (typeof entity?.components.position?.parentId !== "undefined") {
					systemIds.add(entity.components.position.parentId);
				}
				pubsub.publish.pilot.autopilot.get({ shipId: ship.id });
			});

			systemIds.forEach((id) => {
				pubsub.publish.starmapCore.autopilot({ systemId: id });
			});
		}),
	// This one is just used for timeline actions
	setShipDestination: t.procedure
		.meta({
			action: (ctx: DataContext) => {
				return {
					position: {
						name: "Position",
						type: "starmapCoordinates",
						helper:
							"A specific point in space to send the ship. Use as an alternative to Nearby Entity.",
					},
					entityId: {
						name: "Nearby Entity",
						helper:
							"Send the ship somewhere near this entity. This option is preferred.",
					},
				};
			},
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
			const ship = ctx.flight?.ecs.getEntityById(input.shipId);
			if (!ship) throw new Error("No ship found.");

			let position = { x: 0, y: 0, z: 0 };
			let systemId: number | null = null;
			let object: Entity | undefined = undefined;
			if ("entityId" in input) {
				// This ship is being sent close to an object
				object = ctx.flight?.ecs.entities.find((e) => e.id === input.entityId);
				if (!object) throw new Error("No object found.");
				position = getObjectOffsetPosition(object, ship);
				const sys = getObjectSystem(object);
				systemId = sys?.id ?? null;
				if (sys?.id === object.id) systemId = null;
			} else if ("position" in input && input.position) {
				// This waypoint is just being plopped at some random point in space.
				position = input.position;
				const parentId = input.position.parentId;
				if (parentId && typeof parentId === "object") {
					// This waypoint is probably defined in a timeline action, so we need
					// to find which system matches the name.
					const solarSystems =
						ctx.flight?.ecs.componentCache.get("isSolarSystem") || [];
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

			ship?.updateComponent("autopilot", {
				desiredCoordinates: position,
				desiredSolarSystemId: systemId,
			});
			ship?.updateComponent("shipBehavior", {
				destination: {
					parentId: systemId,
					x: position.x,
					y: position.y,
					z: position.z,
				},
				target: {
					parentId: systemId,
					x: position.x,
					y: position.y,
					z: position.z,
				},
			});
			pubsub.publish.pilot.autopilot.get({ shipId: ship.id });
			pubsub.publish.starmapCore.autopilot({ systemId });
		}),

	setOrbit: t.procedure
		.input(
			z.object({
				ships: z.number().array(),
				objectId: z.number(),
			}),
		)
		.send(({ ctx, input }) => {
			const systemIds = new Set<number | null>();

			const orbitedObject = ctx.flight?.ecs.getEntityById(input.objectId);
			if (!orbitedObject) return;
			const objectSystem = getObjectSystem(orbitedObject);
			if (!objectSystem) return;

			for (const shipId of input.ships) {
				const entity = ctx.flight?.ecs.getEntityById(shipId);
				if (!entity) continue;
				const position = getObjectOffsetPosition(orbitedObject, entity);
				entity.updateComponent("autopilot", {
					desiredCoordinates: position,
					desiredSolarSystemId: objectSystem.id,
				});
				entity?.updateComponent("shipBehavior", {
					destination: {
						parentId: objectSystem.id,
						x: position.x,
						y: position.y,
						z: position.z,
					},
					target: {
						parentId: objectSystem.id,
						x: position.x,
						y: position.y,
						z: position.z,
					},
				});

				if (typeof entity?.components.position?.parentId !== "undefined") {
					systemIds.add(entity.components.position.parentId);
				}
				pubsub.publish.pilot.autopilot.get({ shipId: entity.id });
			}
			systemIds.forEach((id) => {
				pubsub.publish.starmapCore.autopilot({ systemId: id });
			});
		}),
	setFollowShip: t.procedure
		.meta({ action: true })
		.input(
			z.object({
				objective: behavior,
				ships: z.union([z.number().array(), z.number()]),
				objectId: z.number(),
			}),
		)
		.send(({ ctx, input }) => {
			const systemIds = new Set<number | null>();

			const followedObject = ctx.flight?.ecs.getEntityById(input.objectId);
			if (!followedObject) return;

			for (const shipId of Array.isArray(input.ships)
				? input.ships
				: [input.ships]) {
				const entity = ctx.flight?.ecs.getEntityById(shipId);
				if (!entity) continue;

				entity.updateComponent("shipBehavior", {
					objective: input.objective,
					target: followedObject.id,
				});

				if (typeof entity?.components.position?.parentId !== "undefined") {
					systemIds.add(entity.components.position.parentId);
				}
				pubsub.publish.pilot.autopilot.get({ shipId: entity.id });
				pubsub.publish.ship.get({ shipId: entity.id });
				pubsub.publish.starmapCore.ship({ shipId: entity.id });
			}
			systemIds.forEach((id) => {
				pubsub.publish.starmapCore.autopilot({ systemId: id });
			});
		}),
	fireTorpedo: t.procedure
		.input(
			z.object({
				objectId: z.number(),
				position: z.object({
					x: z.number(),
					y: z.number(),
					z: z.number(),
					parentId: z.number(),
				}),
			}),
		)
		.send(({ ctx, input }) => {
			const torpedoEntity = new Entity();

			torpedoEntity.addComponent("position", {
				x: input.position.x,
				y: input.position.y,
				z: input.position.z,
				parentId: input.position.parentId,
				type: "solar",
			});
			const directionVector = new Vector3(0, 0, 1)
				.normalize()
				.multiplyScalar(50);

			torpedoEntity.addComponent("velocity", {
				x: directionVector.x,
				y: directionVector.y,
				z: directionVector.z,
			});
			torpedoEntity.addComponent("isTorpedo", {
				launcherId: -1,
				targetId: input.objectId,
				yield: 1,
				damageType: null,
				color: "white",
				guidanceMode: "visual",
				guidanceRange: 5000,
				speed: 50,
				maxForce: 10,
				maxRange: 25000,
			});
			torpedoEntity.addComponent("mass", { mass: 1500 });

			ctx.flight?.ecs.addEntity(torpedoEntity);

			pubsub.publish.starmapCore.torpedos({
				systemId: torpedoEntity.components.position?.parentId || null,
			});
		}),
	setShipsBehavior: t.procedure
		.meta({ action: true })
		.input(
			z.object({
				shipIds: z.union([z.number().array(), z.number()]),
				behavior,
			}),
		)
		.send(({ ctx, input }) => {
			const ids = Array.isArray(input.shipIds)
				? input.shipIds
				: [input.shipIds];
			ids.forEach((shipId) => {
				const entity = ctx.flight?.ecs.getEntityById(shipId);
				entity?.updateComponent("shipBehavior", {
					objective: input.behavior,
				});

				if (input.behavior === "hold") {
					const position = entity?.components.position;
					if (position) {
						entity.updateComponent("shipBehavior", {
							destination: {
								parentId: position.parentId || null,
								x: position.x,
								y: position.y,
								z: position.z,
							},
						});
						entity.updateComponent("autopilot", {
							rotationAutopilot: true,
							forwardAutopilot: true,
							desiredCoordinates: {
								x: position.x,
								y: position.y,
								z: position.z,
							},
							desiredSolarSystemId: position.parentId || null,
						});
					}
				}
				pubsub.publish.pilot.autopilot.get({ shipId });
				pubsub.publish.ship.get({ shipId });
				pubsub.publish.starmapCore.ship({ shipId });
			});
		}),
	stream: t.procedure
		.input(z.object({ systemId: z.number().nullable() }))
		.dataStream(({ entity, input }) => {
			if (!entity) return false;
			if (
				(entity.components.isShip ||
					entity.components.isTorpedo ||
					entity.components.debugSphere) &&
				entity.components.position
			) {
				if (
					entity.components.position.type === "interstellar" &&
					(input.systemId === null || input.systemId === undefined)
				)
					return true;
				if (entity.components.position.parentId === input.systemId) {
					return true;
				}
			}
			return false;
		}),
});
