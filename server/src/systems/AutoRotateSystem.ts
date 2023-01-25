import {Quaternion, Vector3, Matrix4} from "three";
import Controller from "node-pid-controller";
import {Entity, System} from "../utils/ecs";
import {autopilotGetCoordinates} from "../utils/autopilotGetCoordinates";

let positionVec = new Vector3();
let rotationQuat = new Quaternion();
let desiredDestination = new Vector3();
let desiredRotationQuat = new Quaternion();
let up = new Vector3(0, 1, 0);
let matrix = new Matrix4();
const rotationMatrix = new Matrix4().makeRotationY(-Math.PI);

const C_PROPORTION = 1;
const C_INTEGRAL = 0.5;
const C_DERIVATIVE = 0.5;

const getYawPitchRoll = (quat: Quaternion) => {
  const yaw =
    Math.atan2(
      2 * quat.y * quat.w - 2 * quat.x * quat.z,
      1 - 2 * quat.y * quat.y - 2 * quat.z * quat.z
    ) +
    Math.PI * 4;
  const pitch =
    Math.atan2(
      2 * quat.x * quat.w - 2 * quat.y * quat.z,
      1 - 2 * quat.x * quat.x - 2 * quat.z * quat.z
    ) +
    Math.PI * 4;
  const roll =
    Math.asin(2 * quat.x * quat.y + 2 * quat.z * quat.w) + Math.PI * 4;
  return [yaw, pitch, roll] as const;
};

function getClosestAngle(current: number, target: number) {
  if (Math.abs(target - (current + Math.PI * 2)) < Math.abs(target - current)) {
    return current + Math.PI * 2;
  }
  return current;
}
export class AutoRotateSystem extends System {
  test(entity: Entity) {
    return !!(
      entity.components.isShip &&
      entity.components.rotation &&
      entity.components.autopilot
    );
  }

  update(entity: Entity, elapsed: number) {
    const {position, rotation, autopilot} = entity.components;
    if (
      !position ||
      !rotation ||
      !autopilot?.rotationAutopilot ||
      !autopilot?.desiredCoordinates
    ) {
      return;
    }

    // Get the current system the ship is in and the autopilot desired system
    const entitySystem = entity.components.position?.parentId
      ? this.ecs.getEntityById(entity.components.position.parentId)
      : null;
    const destinationSystem = entity.components.autopilot?.desiredSolarSystemId
      ? this.ecs.getEntityById(entity.components.autopilot.desiredSolarSystemId)
      : null;

    autopilotGetCoordinates(
      entity,
      entitySystem,
      destinationSystem,
      desiredDestination,
      positionVec
    );
    const distance = positionVec.distanceTo(desiredDestination);
    rotationQuat.set(rotation.x, rotation.y, rotation.z, rotation.w);
    up.set(0, 1, 0).applyQuaternion(rotationQuat);

    matrix.lookAt(positionVec, desiredDestination, up).multiply(rotationMatrix);
    // Use the thrusters to adjust the rotation of the ship to point towards the desired destination.
    // First, determine the angle to the destination.
    desiredRotationQuat.setFromRotationMatrix(matrix);

    const desiredAngles = getYawPitchRoll(desiredRotationQuat);
    const currentAngles = getYawPitchRoll(rotationQuat);

    // Initialize the controllers, if necessary
    if (!(autopilot.yawController instanceof Controller)) {
      autopilot.yawController = new Controller(
        C_PROPORTION,
        C_INTEGRAL,
        C_DERIVATIVE,
        1000 / 60 / 1000
      );
    }
    if (!(autopilot.pitchController instanceof Controller)) {
      autopilot.pitchController = new Controller(
        C_PROPORTION,
        C_INTEGRAL,
        C_DERIVATIVE,
        1000 / 60 / 1000
      );
    }
    if (!(autopilot.rollController instanceof Controller)) {
      autopilot.rollController = new Controller(
        C_PROPORTION,
        C_INTEGRAL,
        C_DERIVATIVE,
        1000 / 60 / 1000
      );
    }

    // Set the target of the controllers
    autopilot.yawController.target = desiredAngles[0];
    autopilot.pitchController.target = desiredAngles[1];
    autopilot.rollController.target = desiredAngles[2];

    // Update controllers with the current rotation
    let yawCorrection = autopilot.yawController.update(
      getClosestAngle(currentAngles[0], desiredAngles[0])
    );
    let pitchCorrection = autopilot.pitchController.update(
      getClosestAngle(currentAngles[1], desiredAngles[1])
    );
    // Minimize the effect of roll
    let rollCorrection = autopilot.rollController.update(
      getClosestAngle(currentAngles[2], desiredAngles[2])
    );

    if (distance < 1) {
      yawCorrection = 0;
      pitchCorrection = 0;
      rollCorrection = 0;
    }
    // Set the thruster acceleration to those values
    const thrusters = this.ecs.entities.find(
      sysEntity =>
        sysEntity.components.isThrusters &&
        entity.components.shipSystems?.shipSystems.has(sysEntity.id)
    );
    if (thrusters?.components?.isThrusters) {
      thrusters.updateComponent("isThrusters", {
        rotationDelta: {
          x: Math.min(Math.max(pitchCorrection, -1), 1),
          y: Math.min(Math.max(yawCorrection, -1), 1),
          z: Math.min(Math.max(rollCorrection, -1), 1),
        },
      });
    }

    const rotationDifference = Math.abs(
      rotationQuat.angleTo(desiredRotationQuat)
    );

    if (rotationDifference <= 0.5 * (Math.PI / 180)) {
      // If we're close enough, make it exact. That way the ship won't overshoot the destination so easily.
      entity.updateComponent("rotation", {
        x: desiredRotationQuat.x,
        y: desiredRotationQuat.y,
        z: desiredRotationQuat.z,
        w: desiredRotationQuat.w,
      });
    }
  }
}
