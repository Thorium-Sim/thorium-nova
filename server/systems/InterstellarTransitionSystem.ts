import {distance3d} from "server/helpers/distance3d";
import Entity from "server/helpers/ecs/entity";
import System from "server/helpers/ecs/system";
import {getOrbitPosition} from "server/helpers/getOrbitPosition";
import {pubsub} from "server/helpers/pubsub";
import {outfitPublish} from "server/schema/plugins/outfits/utils";
import {Vector3} from "three";

const MIN_SYSTEM_SIZE = 10_000;
const SYSTEM_PADDING = 1.05;
// Get the maximum distance necessary to leave or enter
// This requires getting the distance of all of the objects from the center of the solar system.
// We don't care about moons though
function getMaxDistance(entities: Entity[], systemId: string) {
  const distance = entities.reduce((prev, next) => {
    if (next.satellite?.parentId === systemId) {
      // It's a star or planet
      const position = getOrbitPosition({
        radius: next.satellite.distance,
        eccentricity: next.satellite.eccentricity,
        orbitalArc: next.satellite.orbitalArc,
        orbitalInclination: next.satellite.orbitalInclination,
      });
      const distance = distance3d({x: 0, y: 0, z: 0}, position);

      if (distance > prev) return distance;
    } else if (
      next.isStatic &&
      next.interstellarPosition?.systemId === systemId &&
      next.position
    ) {
      // It's a ship!
      const distance = distance3d({x: 0, y: 0, z: 0}, next.position);
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

export class InterstellarTransitionSystem extends System {
  test(entity: Entity) {
    return !!(entity.isShip && !entity.isStatic);
  }
  update(entity: Entity, elapsed: number) {
    if (!entity.position) return;
    const system = this.ecs.entities.find(
      s => s.id === entity.interstellarPosition?.systemId
    );
    if (system) {
      // Transition from inside a solar system to interstellar space.
      // Check if the ship is on the outskirts of the solar system
      const maxDistance =
        getMaxDistance(this.ecs.entities, system.id) * SYSTEM_PADDING;
      const entityDistance = distance3d({x: 0, y: 0, z: 0}, entity.position);
      if (maxDistance - entityDistance < 0) {
        // Transition time!
        entity.updateComponent("interstellarPosition", {systemId: null});
        entity.updateComponent("position", system.position);
        // We also need to update the warp engines so they go faster.

        const warpEngines = this.ecs.entities.find(
          e =>
            e.isOutfit &&
            e.warpEngines &&
            e.shipAssignment?.shipId === entity.id
        );
        if (warpEngines?.warpEngines) {
          const {
            interstellarCruisingSpeed,
            minSpeedMultiplier,
            warpFactorCount,
            currentWarpFactor,
          } = warpEngines.warpEngines;

          const cruisingSpeed = interstellarCruisingSpeed;

          const minWarp = cruisingSpeed * minSpeedMultiplier;

          // Calculate max warp speed based on the factor and the number of warp factors
          let warpSpeed = 0;
          if (currentWarpFactor === 1) {
            warpSpeed = minWarp;
          } else if (currentWarpFactor > 1) {
            warpSpeed =
              (cruisingSpeed - minWarp) *
              ((currentWarpFactor - 1) / (warpFactorCount - 1));
          }

          warpEngines.updateComponent("warpEngines", {
            maxVelocity: warpSpeed,
          });
          outfitPublish({plugin: undefined, ship: entity, outfit: warpEngines});
        }
        pubsub.publish("universeSystemShips", {
          systemId: system.id,
          ships: this.ecs.entities.filter(
            e => e?.isShip && e?.interstellarPosition?.systemId === system.id
          ),
        });
        if (entity.isPlayerShip) {
          pubsub.publish("playerShip", {shipId: entity.id, ship: entity});
        }
      }
    } else {
      // Transition from interstellar space to within a solar system
      // Check if the ship has locked course on to a solar system, and is within range
      const navigation = this.ecs.entities.find(
        e => e.navigation && e.shipAssignment?.shipId === entity.id
      );
      if (navigation?.navigation) {
        const destinationWaypoint = this.ecs.entities.find(
          e => e.id === navigation.navigation?.destinationWaypointId
        );
        const destinationSystem = this.ecs.entities.find(
          e => e.id === destinationWaypoint?.interstellarPosition?.systemId
        );
        if (!destinationSystem?.position || !entity.position) return;
        const distance = distance3d(
          entity.position,
          destinationSystem.position
        );
        if (distance < 0.001) {
          entity.updateComponent("interstellarPosition", {
            systemId: destinationSystem.id,
          });

          // create a vector of the ship from the center of the system, and position it outside the heliopause
          const maxDistance = getMaxDistance(
            this.ecs.entities,
            destinationSystem.id
          );
          shipPosition.set(
            entity.position.x,
            entity.position.y,
            entity.position.z
          );
          systemPosition.set(
            destinationSystem.position.x,
            destinationSystem.position.y,
            destinationSystem.position.z
          );
          direction
            .subVectors(shipPosition, systemPosition)
            .normalize()
            .multiplyScalar(maxDistance);

          entity.updateComponent("position", {
            x: direction.x,
            y: direction.y,
            z: direction.z,
          });

          pubsub.publish("universeSystemShips", {
            systemId: destinationSystem.id,
            ships: this.ecs.entities.filter(
              e =>
                e?.isShip &&
                e?.interstellarPosition?.systemId === destinationSystem.id
            ),
          });
          if (entity.isPlayerShip) {
            pubsub.publish("playerShip", {shipId: entity.id, ship: entity});
          }

          // Update the warp engines
          const warpEngines = this.ecs.entities.find(
            e =>
              e.isOutfit &&
              e.warpEngines &&
              e.shipAssignment?.shipId === entity.id
          );
          if (warpEngines?.warpEngines) {
            const {
              planetaryCruisingSpeed,
              minSpeedMultiplier,
              warpFactorCount,
            } = warpEngines.warpEngines;
            const currentWarpFactor = 1;
            const cruisingSpeed = planetaryCruisingSpeed;
            const minWarp = cruisingSpeed * minSpeedMultiplier;

            // Calculate max warp speed based on the factor and the number of warp factors
            let warpSpeed = 0;
            if (currentWarpFactor === 1) {
              warpSpeed = minWarp;
            } else if (currentWarpFactor > 1) {
              warpSpeed =
                (cruisingSpeed - minWarp) *
                ((currentWarpFactor - 1) / (warpFactorCount - 1));
            }

            warpEngines.updateComponent("warpEngines", {
              forwardAcceleration: 0,
              forwardVelocity: warpSpeed,
              maxVelocity: warpSpeed,
              currentWarpFactor: 1,
            });
            outfitPublish({
              plugin: undefined,
              ship: entity,
              outfit: warpEngines,
            });
          }
        }
      }
    }
  }
}
