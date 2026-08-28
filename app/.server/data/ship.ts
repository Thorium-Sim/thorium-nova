import { pubsub } from "@thorium/.server/init/pubsub";
import { t } from "@thorium/.server/init/t";
import { spawnShip } from "@thorium/.server/spawners/ship";
import { alertTypes } from "@thorium/ecs-components/shipAlerts";
import { destroyShip } from "@thorium/utils/.server/ship/collisionDamage";
import type { ECS, Entity } from "@thorium/utils/ecs";
import { getPluginTextPatterns, interpolateText } from "@thorium/utils/interpolationEngine";
import type { RNG } from "@thorium/utils/rng";
import { getCompletePositionFromOrbit, getObjectSystem } from "@thorium/utils/starmap/position";
import { Matrix4, Quaternion, Vector3 } from "three";
import z from "zod";

export const ship = t.router({
	get: t.procedure
		.input(z.union([z.object({ clientId: z.string() }), z.object({ shipId: z.number() })]))
		.filter((publish: { shipId: number } | { clientId: string }, { ctx, input }) => {
			if (!publish) return true;
			if (
				"shipId" in publish &&
				publish.shipId !==
					("shipId" in input
						? input.shipId
						: ctx.getFlightClient(input.clientId)?.components.flightClient?.shipId)
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
		})
		.autoPublish(["isShip", "flightClient"], (entity) => {
			if (entity.components.flightClient) {
				return { clientId: entity.components.flightClient.clientId };
			}
			if (entity.components.isShip) {
				return { shipId: entity.id };
			}
		})
		.request(({ ctx, input }) => {
			const shipId =
				"shipId" in input
					? input.shipId
					: ctx.getFlightClient(input.clientId)?.components.flightClient?.shipId || -1;
			let ship: Entity | null = null;
			try {
				ship = ctx.ecs?.getEntityById(shipId) || null;
			} catch {}
			if (!ship)
				return {
					id: shipId,
					isShip: false,
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
					stations: [],
				};
			const systemId = ship.components.position?.parentId;
			const systemPosition = systemId
				? ctx.flight?.ecs.getEntityById(systemId)?.components.position || null
				: null;
			const assets = ship.components.isShip!.assets;
			return {
				id: ship.id,
				isShip: true,
				name: ship.components.identity!.name,
				registry: ship.components.isShip!.registry,
				alertLevel: ship.components.isShip!.alertLevel,
				currentSystem: systemId || null,
				systemPosition,
				assets,
				isDestroyed: ship.components.isDestroyed,
				stations: ship.components.stationComplement?.stations || [],
			};
		}),
	players: t.procedure
		.autoPublish(["isPlayerShip"], () => null)
		.request(({ ctx }) => {
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
		.input(z.union([z.object({ clientId: z.string() }), z.object({ shipId: z.number() })]))
		.filter((publish: { shipId: number }, { ctx, input }) => {
			const shipId =
				"shipId" in input
					? input.shipId
					: ctx.getFlightClient(input.clientId)?.components.flightClient?.shipId;
			if (publish && publish.shipId !== shipId) return false;
			return true;
		})
		.autoPublish(["position", "isShip"], (entity) =>
			entity.components.isPlayerShip ? { shipId: entity.id } : null,
		)
		.request(({ ctx, input }) => {
			const ship = ctx.flight?.ecs.getEntityById(
				"shipId" in input
					? input.shipId
					: ctx.getFlightClient(input.clientId)?.components.flightClient?.shipId || -1,
			);
			if (!ship)
				return {
					id: -1,
					name: "",
					registry: "",
					currentSystem: null,
					alertLevel: "5",
					category: "",
					shipClass: "",
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
			const assets = ship.components.isShip?.assets || {};
			return {
				id: ship.id,
				name: ship.components.identity?.name || "Unnamed",
				registry: ship.components.isShip?.registry || "",
				alertLevel: ship.components.isShip?.alertLevel || "5",
				category: ship.components.isShip?.category || "",
				shipClass: ship.components.isShip?.shipClass || "",
				currentSystem: systemId || null,
				systemPosition,
				assets,
				isDestroyed: ship.components.isDestroyed,
			};
		}),
	rooms: t.procedure
		.input(z.object({ shipId: z.number() }))
		.filter((publish: { shipId: number } | null, { input }) => {
			if (publish && publish.shipId !== input.shipId) return false;
			return true;
		})
		.autoPublish(["shipMap"], (entity) => [{ shipId: entity.id }])
		.request(({ ctx, input }) => {
			const ship = ctx.ecs.getEntityById(input.shipId);
			return {
				rooms:
					ship?.components.shipMap?.deckNodes.flatMap((n) =>
						n.isRoom
							? {
									id: n.id,
									name: n.name,
									systems: n.systems,
									deckIndex: n.deckIndex,
									flags: n.flags,
								}
							: [],
					) || [],
				decks: ship?.components.shipMap?.decks.map((d) => ({ name: d.name })) || [],
			};
		}),
	spawn: t.procedure

		.input(
			z.object({
				template: z.object({ name: z.string(), pluginId: z.string() }),
				entityId: z.number().optional(),
				distance: z.number().optional(),
				position: z
					.object({
						parentId: z
							.union([z.number(), z.object({ name: z.string(), pluginId: z.string() })])
							.nullable(),
						x: z.number(),
						y: z.number(),
						z: z.number(),
					})
					.optional(),
				tags: z.array(z.string()).optional(),
			}),
		)
		.meta({
			action: () => {
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
						helper: "Place the ship nearby this entity. This option is preferred.",
					},
					distance: {
						type: "number",
						helper: "How far to place the ship from the nearby entity in kilometers.",
					},
				};
			},
		})
		.output(z.object({ id: z.number() }))
		.send(async ({ ctx, input }) => {
			if (!ctx.flight) throw new Error("Flight not found.");

			const shipTemplate = ctx.server.plugins
				.find((plugin) => plugin.name === input.template.pluginId)
				?.aspects.ships.find((ship) => ship.name === input.template.name);

			if (!shipTemplate) throw new Error("Ship template not found.");

			const { ship: shipEntity, extraEntities } = await spawnShip(ctx, shipTemplate, {
				name: interpolateText(
					shipTemplate.nameTemplate,
					{},
					getPluginTextPatterns(ctx.server),
					ctx.flight.ecs.rng,
				),
				tags: input.tags,
				flightMode: ctx.flight.mode,
			});

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

		.input(
			z.object({
				shipId: z.number(),
				entityId: z.number().optional(),
				position: z
					.object({
						parentId: z
							.union([z.number(), z.object({ name: z.string(), pluginId: z.string() })])
							.nullable(),
						x: z.number(),
						y: z.number(),
						z: z.number(),
					})
					.optional(),
			}),
		)
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
					helper: "Place the ship nearby this entity. This option is preferred.",
				},
			}),
		})
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
	pointAt: t.procedure
		.input(z.object({ shipId: z.number(), objectId: z.number() }))
		.send(({ ctx, input }) => {
			const entity = ctx.ecs.getEntityById(input.shipId);
			if (!entity) return;
			const object = ctx.ecs.getEntityById(input.objectId);
			if (!object) return;

			// If the object is in another stage, we need to point in the direction
			// of that object's stage.
			const rotationQuat = getDirectionBetweenTwoEntities(entity, object);
			entity.updateComponent("rotation", {
				x: rotationQuat.x,
				y: rotationQuat.y,
				z: rotationQuat.z,
				w: rotationQuat.w,
			});
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
function getNearbyEntityPoint(objectEntity: Entity, rng: RNG, distance?: number) {
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

const rotationQuat = new Quaternion();
const desiredRotationQuat = new Quaternion();
const up = new Vector3(0, 1, 0);
const positionVec = new Vector3();
const objectVec = new Vector3();
const matrix = new Matrix4();
const rotationMatrix = new Matrix4().makeRotationY(-Math.PI);

function getDirectionBetweenTwoEntities(entity1: Entity, entity2: Entity) {
	const { position, rotation } = entity1.components;
	const { position: objPos } = entity2.components;
	if (!position || !rotation || !objPos) throw new Error("Unable to determine direction");

	if (position.parentId === objPos.parentId) {
		positionVec.set(position.x, position.y, position.z);
		objectVec.set(objPos.x, objPos.y, objPos.z);
	} else if (!position.parentId) {
		// Ship in interstellar — point at the object's parent system
		positionVec.set(position.x, position.y, position.z);
		const objectParent = getObjectSystem(entity2);
		const sysPos = objectParent?.components.position;
		if (!sysPos) throw new Error("Unable to determine direction");
		objectVec.set(sysPos.x, sysPos.y, sysPos.z);
	} else if (!objPos.parentId) {
		// Object in interstellar - point from the ship's system to the object
		objectVec.set(objPos.x, objPos.y, objPos.z);
		const shipParent = getObjectSystem(entity1);
		const sysPos = shipParent?.components.position;
		if (!sysPos) throw new Error("Unable to determine direction");
		positionVec.set(sysPos.x, sysPos.y, sysPos.z);
	} else {
		// Two different systems. Point from the ship's system position to the object's system position
		const shipParent = getObjectSystem(entity1);
		const sysPos = shipParent?.components.position;
		if (!sysPos) throw new Error("Unable to determine direction");
		positionVec.set(sysPos.x, sysPos.y, sysPos.z);
		const objectParent = getObjectSystem(entity2);
		const objSysPos = objectParent?.components.position;
		if (!objSysPos) throw new Error("Unable to determine direction");
		objectVec.set(objSysPos.x, objSysPos.y, objSysPos.z);
	}

	rotationQuat.set(rotation.x, rotation.y, rotation.z, rotation.w);
	up.set(0, 1, 0).applyQuaternion(rotationQuat);
	matrix.lookAt(positionVec, objectVec, up).multiply(rotationMatrix);
	desiredRotationQuat.setFromRotationMatrix(matrix);

	return desiredRotationQuat;
}
