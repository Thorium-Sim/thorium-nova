import Entity from "server/helpers/ecs/entity";
import System from "server/helpers/ecs/system";
import {updateOutfit} from "server/schema/plugins/outfits/utils";
import {Vector3} from "three";
const LY_IN_KM = 9_460_730_472_580.8;

const shipPosition = new Vector3();
const waypointPosition = new Vector3();
export class ThrusterSystem extends System {
  test(entity: Entity) {
    return !!entity.components.isWaypoint;
  }
  update(entity: Entity, elapsed: number) {
    const ship = this.ecs.entities.find(
      e => e.id === entity.components.isWaypoint?.assignedShipId
    );
    if (
      !ship ||
      !ship.isShip ||
      !entity.isWaypoint ||
      !ship.position ||
      !entity.position
    )
      return;
    if (
      ship.interstellarPosition?.systemId !==
      entity.interstellarPosition?.systemId
    )
      return;
    shipPosition.set(ship.position.x, ship.position.y, ship.position.z);
    waypointPosition.set(
      entity.position.x,
      entity.position.y,
      entity.position.z
    );

    let distance = Math.abs(shipPosition.distanceTo(waypointPosition));

    const clearWaypoint = () => {
      this.ecs.removeEntity(entity);
      ship?.updateComponent("autopilot", {
        rotationAutopilot: false,
        forwardAutopilot: false,
      });
      const thrusters = this.ecs.entities.find(
        t => t.thrusters && t.shipAssignment?.shipId === ship.id
      );
      thrusters?.updateComponent("thrusters", {
        rotationDelta: {x: 0, y: 0, z: 0},
      });
      updateOutfit({
        shipId: ship.id,
        outfitType: "impulseEngines",
        update: {targetSpeed: 0},
      });
      updateOutfit({
        shipId: ship.id,
        outfitType: "warpEngines",
        update: {currentWarpFactor: 0, maxVelocity: 0},
      });
    };
    if (!ship.interstellarPosition?.systemId) {
      // One one hundredth of a lightyear
      if (distance < 0.01) {
        clearWaypoint();
      }
    } else {
      if (distance < 10) {
        // 10 Kilometers
        clearWaypoint();
      }
    }
  }
}
