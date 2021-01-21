import {distance3d} from "server/helpers/distance3d";
import Entity from "server/helpers/ecs/entity";
import System from "server/helpers/ecs/system";
import {getOrbitPosition} from "server/helpers/getOrbitPosition";
import {pubsub} from "server/helpers/pubsub";
import {outfitPublish} from "server/schema/plugins/outfits/utils";

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
      // Check if the ship is on the outskirts of the solar system
      // Get the maximum distance necessary to leave
      // This requires getting the distance of all of the objects from the center of the solar system.
      // We don't care about moons though
      let maxDistance = this.ecs.entities.reduce((prev, next) => {
        if (next.satellite?.parentId === system.id) {
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
          next.interstellarPosition?.systemId === system.id &&
          next.position
        ) {
          // It's a ship!
          const distance = distance3d({x: 0, y: 0, z: 0}, next.position);
          if (distance > prev) return distance;
        }
        return prev;
      }, 0);

      // Multiply the max distance by a constant to give a bit of extra room around the edges
      const SYSTEM_PADDING = 1.01;
      maxDistance *= SYSTEM_PADDING;
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
            planetaryCruisingSpeed,
            minSpeedMultiplier,
            warpFactorCount,
            currentWarpFactor,
          } = warpEngines.warpEngines;

          const cruisingSpeed =
            entity.interstellarPosition?.systemId === null
              ? interstellarCruisingSpeed
              : planetaryCruisingSpeed;

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
      // Check if the ship has locked course on to a solar system, and is within range
    }
  }
}
