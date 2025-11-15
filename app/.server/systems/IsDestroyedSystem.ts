import { pubsub } from "@thorium/.server/init/pubsub";
import { type Entity, System } from "@thorium/utils/ecs";
import type { World } from "@thorium-sim/rapier3d-node";
import {
	getCompletePositionFromOrbit,
	getObjectOffsetPosition,
} from "@thorium/utils/starmap/position";

export class IsDestroyedSystem extends System {
	static flightMode = ["nova"];
	test(entity: Entity) {
		return !!entity.components.isDestroyed;
	}
	update(entity: Entity, elapsed: number) {
		const { timeToDestroy, timer } = entity.components.isDestroyed!;
		if (typeof timeToDestroy === "number" && timeToDestroy > 0) {
			entity.updateComponent("isDestroyed", { timer: timer + elapsed });
			if (timer + elapsed >= timeToDestroy) {
				if (!entity.components.isPlayerShip) {
					deleteShip(entity);
				} else {
					respawnShip(entity);
				}
			}
		}
	}
}

function deleteShip(entity: Entity) {
	// Remove the entity from any physics worlds it is a part of
	const handles = entity.components.physicsHandles?.handles as Map<
		number,
		number
	>;
	for (const [worldEntityId, handle] of handles.entries()) {
		const worldEntity = entity.ecs.getEntityById(worldEntityId);
		if (!worldEntity) continue;
		const world = worldEntity.components.physicsWorld?.world as World;
		if (!world) continue;
		const body = world.getRigidBody(handle);
		if (!body) continue;
		world.removeRigidBody(body);
	}
	const systemId = entity.components.position?.parentId || null;
	entity.ecs.removeEntity(entity);

	if (entity.components.isTorpedo) {
		pubsub.publish.starmapCore.torpedos({
			systemId,
		});
	}
	if (entity.components.isShip) {
		// Also remove all the ship systems and crew
		// TODO April 25, 2025 - Remove Crew
		for (const shipSystem of entity.components.shipSystems?.shipSystems || []) {
			entity.ecs.removeEntityById(shipSystem[0]);
		}
		pubsub.publish.starmapCore.ships({
			systemId,
		});
	}
}

function respawnShip(entity: Entity) {
	// Bring the ship back from the dead.
	// Restore hull entirely, bring all
	// non-vulnerable systems back to operational,
	// and move the ship to a more safe location, in case of collision.
	entity.removeComponent("isDestroyed");
	entity.updateComponent("hull", {
		hull: entity.components.hull?.maxHull || 1,
	});

	// Repair the ship systems
	for (const systemId of entity.components.shipSystems?.shipSystems.keys() ||
		[]) {
		const system = entity.ecs.getEntityById(systemId);
		if (!system?.components.isShipSystem || !system.components.damage) continue;
		if (system.components.damage.vulnerability === "vulnerable") continue;
		// Fix the system a bunch, but not all the way.
		system.updateComponent("damage", {
			offline: false,
			efficiency: 1,
			cascadeRisk: 0,
			instability: 0,
			heatMultiplier: 1,
		});
	}
	const position = entity.components.position!;

	// Find a point 1,000km from any large object and set the position to that
	let closestPlanet: Entity | null = null;
	let previousDistance = Number.POSITIVE_INFINITY;
	for (const e of entity.ecs.componentCache.get("position") || []) {
		if (
			e.components.position?.parentId === entity.components.position?.parentId
		) {
			if (e.components.isPlanet || e.components.isStarbase) {
				if (!closestPlanet) {
					closestPlanet = e;
					continue;
				}
				const p = getCompletePositionFromOrbit(e);
				const distance = Math.hypot(
					position.x - p.x,
					position.y - p.y,
					position.z - p.z,
				);
				if (distance < previousDistance) {
					previousDistance = distance;
					closestPlanet = e;
				}
			}
		}
	}

	// If we can't find a close by planet, then we'll just keep the current position. How bad could it be?
	if (closestPlanet) {
		const { x, y, z } = getObjectOffsetPosition(closestPlanet, position, 5_000);
		entity.updateComponent("position", { x, y, z });
	}

	pubsub.publish.ship.player({ shipId: entity.id });
}
