import Entity from "server/helpers/ecs/entity";
import System from "server/helpers/ecs/system";
import {Quaternion, Vector3} from "three";

function unitVelocity(v: number, a: number, max: number, slowing?: boolean) {
  const rawVelocity = !slowing || Math.sign(v + a) === Math.sign(v) ? v + a : 0;
  // If they are already going faster than the max, don't limit them.
  const maxSpeed = Math.abs(max) < Math.abs(v) ? Math.abs(v) : max;
  return Math.max(-1 * maxSpeed, Math.min(maxSpeed, rawVelocity));
}

export class ThrusterSystem extends System {
  test(entity: Entity) {
    return !!(
      entity.components.thrusters &&
      entity.components.isOutfit &&
      entity.components.shipAssignment?.ship
    );
  }
  update(entity: Entity, elapsed: number) {
    const ship = entity.components.shipAssignment?.ship;
    if (!ship || !ship.isShip || !entity.thrusters) return;
    const {mass} = ship.isShip;

    const {
      direction,
      directionThrust,
      rotationDelta,
      rotationMaxSpeed,
      rotationThrust,
      rotationVelocity,
    } = entity.thrusters;

    entity.thrusters.directionAcceleration = {
      x: ((direction.x * directionThrust) / mass) * elapsed,
      y: ((direction.y * directionThrust) / mass) * elapsed,
      z: ((direction.z * directionThrust) / mass) * elapsed,
    };

    // Do all the same things with rotation.
    const rotationAcceleration = {
      x: ((rotationDelta.x * rotationThrust) / mass) * elapsed,
      y: ((rotationDelta.y * rotationThrust) / mass) * elapsed,
      z: ((rotationDelta.z * rotationThrust) / mass) * elapsed,
    };

    let slowingRotation = {x: false, y: false, z: false};

    const rotationDampening = -10;
    if (Math.abs(rotationAcceleration.x) === 0) {
      slowingRotation.x = true;
      // Apply an acceleration opposite to the current velocity
      rotationAcceleration.x =
        Math.sign(rotationVelocity.x) * rotationDampening * elapsed;
    }
    if (Math.abs(rotationAcceleration.y) === 0) {
      slowingRotation.y = true;
      rotationAcceleration.y =
        Math.sign(rotationVelocity.y) * rotationDampening * elapsed;
    }
    if (Math.abs(rotationAcceleration.z) === 0) {
      slowingRotation.z = true;
      rotationAcceleration.z =
        Math.sign(rotationVelocity.z) * rotationDampening * elapsed;
    }

    // If we cross 0 while slowing, set the velocity to 0
    rotationVelocity.x = unitVelocity(
      rotationVelocity.x,
      rotationAcceleration.x,
      rotationMaxSpeed * Math.abs(rotationDelta.x),
      slowingRotation.x
    );
    rotationVelocity.y = unitVelocity(
      rotationVelocity.y,
      rotationAcceleration.y,
      rotationMaxSpeed * Math.abs(rotationDelta.y),
      slowingRotation.y
    );
    rotationVelocity.z = unitVelocity(
      rotationVelocity.z,
      rotationAcceleration.z,
      rotationMaxSpeed * Math.abs(rotationDelta.z),
      slowingRotation.z
    );
  }
}
