import { pubsub } from "@thorium/.server/init/pubsub";
import { Matrix4, Quaternion, Vector3 } from "three";
import { type Entity, System } from "@thorium/utils/ecs";
import { getOrbitPosition } from "@thorium/utils/starmap/getOrbitPosition";
import { lightMinuteToLightYear } from "@thorium/utils/unitTypes";
import { pathfinder } from "@thorium/utils/starmap/pathfinder.server";

const MIN_SYSTEM_SIZE = 10_000;
const SYSTEM_PADDING = 1.05;
// Get the maximum distance necessary to leave or enter
// This requires getting the distance of all of the objects from the center of the solar system.
// We don't care about moons though
function getMaxDistance(entities: Entity[], systemId: number) {
	const distance = entities.reduce((prev, next) => {
		if (next.components.satellite?.parentId === systemId) {
			// It's a star or planet
			const position = getOrbitPosition(next.components.satellite);
			const distance = Math.hypot(position.x, position.y, position.z);

			if (distance > prev) return distance;
		} else if (
			next.components.position &&
			next.components.position.parentId === systemId &&
			next.components.isStatic
		) {
			// It's a ship!
			const distance = Math.hypot(
				next.components.position.x,
				next.components.position.y,
				next.components.position.z,
			);
			if (distance > prev) return distance;
		}
		return prev;
	}, 0);
	// Multiply the max distance by a constant to give a bit of extra room around the edges
	return Math.max(MIN_SYSTEM_SIZE, distance);
}

const direction = new Vector3();
const systemPosition = new Vector3();
const shipPosition = new Vector3();
const desiredDestination = new Vector3();
const desiredRotationQuat = new Quaternion();
const up = new Vector3(0, 1, 0);
const matrix = new Matrix4();
const rotationMatrix = new Matrix4().makeRotationY(-Math.PI);

export class InterstellarTransitionSystem extends System {
	static flightMode = ["nova"];
	test(entity: Entity) {
		return !!(
			entity.components.isShip &&
			entity.components.position &&
			entity.components.velocity
		);
	}
	update(entity: Entity, elapsed: number) {
		// const warpSystem = this.ecs.systems.find(sys =>sys.constructor.name === "WarpSystem")
		if (!entity.components.position) return;
		const system = this.ecs.getEntityById(
			entity.components.position?.parentId || -1,
		);
		const autopilot = entity.components.autopilot;

		if (system) {
			// Transition from inside a solar system to interstellar space.
			// If the entity's destination is inside the current solar system, don't leave it
			if (system.id === autopilot?.desiredSolarSystemId) return;
			// Check if the ship is on the outskirts of the solar system
			const entitiesWithPosition = [
				...(this.ecs.componentCache.get("position") || []),
				...(this.ecs.componentCache.get("satellite") || []),
			];
			const maxDistance =
				getMaxDistance(entitiesWithPosition, system.id) * SYSTEM_PADDING;
			const entityDistance = Math.hypot(
				entity.components.position.x,
				entity.components.position.y,
				entity.components.position.z,
			);

			if (maxDistance - entityDistance < 0 && system.components.position) {
				// Transition time!
				const { x, y, z } = system.components.position;
				entity.updateComponent("position", {
					x,
					y,
					z,
					type: "interstellar",
					parentId: null,
				});
				entity.addComponent("snapInterpolation");
				// We also need to update the warp engines so they go faster.

				// const warpEngines = warpSystem?.entities.find(e => entity.components.shipSystems?.shipSystemIds.includes(e.id) && e.components.isWarpEngines)
				// if (warpEngines?.components.isWarpEngines) {
				//   const {
				//     interstellarCruisingSpeed,
				//     minSpeedMultiplier,
				//     warpFactorCount,
				//     currentWarpFactor,
				//   } = warpEngines.components.isWarpEngines;

				//   const cruisingSpeed = interstellarCruisingSpeed;

				//   const minWarp = cruisingSpeed * minSpeedMultiplier;

				//   // Calculate max warp speed based on the factor and the number of warp factors
				//   let warpSpeed = 0;
				//   if (currentWarpFactor === 1) {
				//     warpSpeed = minWarp;
				//   } else if (currentWarpFactor > 1) {
				//     warpSpeed =
				//       (cruisingSpeed - minWarp) *
				//       ((currentWarpFactor - 1) / (warpFactorCount - 1));
				//   }

				//   warpEngines.updateComponent("isWarpEngines", {
				//     maxVelocity: warpSpeed,
				//   });
				//   outfitPublish({plugin: undefined, ship: entity, outfit: warpEngines});
				// }
				pubsub.publish.starmapCore.ships({ systemId: system.id });
				pubsub.publish.starmapCore.ships({ systemId: null });
				pubsub.publish.starmapCore.ship({ shipId: entity.id });

				if (entity.components.isPlayerShip) {
					pubsub.publish.navigation.ship({ shipId: entity.id });
					pubsub.publish.ship.player({ shipId: entity.id });
				}
			}
		} else {
			// Transition from interstellar space to within a solar system
			// Check if the ship has locked course on to a solar system, and is within range
			const destinationWaypoint = this.ecs.getEntityById(
				autopilot?.destinationWaypointId || -1,
			);
			const destinationSystem = this.ecs.getEntityById(
				autopilot?.desiredSolarSystemId || -1,
			);
			if (
				!destinationSystem?.components.position ||
				!entity.components.position
			)
				return;
			const distance = Math.hypot(
				entity.components.position.x - destinationSystem.components.position.x,
				entity.components.position.y - destinationSystem.components.position.y,
				entity.components.position.z - destinationSystem.components.position.z,
			);
			// 1/100th of a lightyear
			if (lightMinuteToLightYear(distance) < 0.01) {
				const entitiesWithPosition = [
					...(this.ecs.componentCache.get("position") || []),
					...(this.ecs.componentCache.get("satellite") || []),
				];

				// create a vector of the ship from the center of the system, and position it outside the heliopause
				const maxDistance = getMaxDistance(
					entitiesWithPosition,
					destinationSystem.id,
				);
				shipPosition.set(
					entity.components.position.x,
					entity.components.position.y,
					entity.components.position.z,
				);
				systemPosition.set(
					destinationSystem.components.position.x,
					destinationSystem.components.position.y,
					destinationSystem.components.position.z,
				);
				direction
					.subVectors(shipPosition, systemPosition)
					.normalize()
					.multiplyScalar(maxDistance);

				entity.updateComponent("position", {
					x: direction.x,
					y: direction.y,
					z: direction.z,
					parentId: destinationSystem.id,
					type: "solar",
				});
				entity.addComponent("snapInterpolation");

				// Also set the rotation to the destination to be spot-on to the destination
				if (
					destinationWaypoint?.components.isWaypoint?.attachedObjectId !==
						destinationSystem.id &&
					destinationWaypoint?.components.position
				) {
					desiredDestination.set(
						destinationWaypoint.components.position.x,
						destinationWaypoint.components.position.y,
						destinationWaypoint.components.position.z,
					);

					up.set(0, 1, 0);
					matrix
						.lookAt(direction, desiredDestination, up)
						.multiply(rotationMatrix);
					desiredRotationQuat.setFromRotationMatrix(matrix);
					entity.updateComponent("rotation", {
						x: desiredRotationQuat.x,
						y: desiredRotationQuat.y,
						z: desiredRotationQuat.z,
						w: desiredRotationQuat.w,
					});
				}

				// Generate a path to get to the destination
				if (entity.components.autopilot?.desiredCoordinates) {
					const { x, y, z } = entity.components.autopilot.desiredCoordinates;
					const path = pathfinder(entity, new Vector3(x, y, z));
					const nextCoordinates = path?.shift();
					entity.updateComponent("autopilot", {
						path,
						nextCoordinates,
						desiredRotation: null,
					});
				}
				pubsub.publish.starmapCore.ships({ systemId: destinationSystem.id });
				pubsub.publish.starmapCore.ships({ systemId: null });
				pubsub.publish.starmapCore.ship({ shipId: entity.id });

				if (entity.components.isPlayerShip) {
					pubsub.publish.navigation.ship({ shipId: entity.id });
					pubsub.publish.ship.player({ shipId: entity.id });
				}
				// // Update the warp engines
				// const warpEngines = this.ecs.entities.find(
				//   e =>
				//     e.isOutfit &&
				//     e.warpEngines &&
				//     e.shipAssignment?.shipId === entity.id
				// );
				// if (warpEngines?.warpEngines) {
				//   const {
				//     planetaryCruisingSpeed,
				//     minSpeedMultiplier,
				//     warpFactorCount,
				//   } = warpEngines.warpEngines;
				//   const currentWarpFactor = 1;
				//   const cruisingSpeed = planetaryCruisingSpeed;
				//   const minWarp = cruisingSpeed * minSpeedMultiplier;

				//   // Calculate max warp speed based on the factor and the number of warp factors
				//   let warpSpeed = 0;
				//   if (currentWarpFactor === 1) {
				//     warpSpeed = minWarp;
				//   } else if (currentWarpFactor > 1) {
				//     warpSpeed =
				//       (cruisingSpeed - minWarp) *
				//       ((currentWarpFactor - 1) / (warpFactorCount - 1));
				//   }

				//   warpEngines.updateComponent("warpEngines", {
				//     forwardAcceleration: 0,
				//     forwardVelocity: warpSpeed,
				//     maxVelocity: warpSpeed,
				//     currentWarpFactor: 1,
				//   });
				//   outfitPublish({
				//     plugin: undefined,
				//     ship: entity,
				//     outfit: warpEngines,
				//   });
				// }
			}
		}
	}
}
