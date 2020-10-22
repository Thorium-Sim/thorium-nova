import Entity from "server/helpers/ecs/entity";
import System from "server/helpers/ecs/system";
import {Camera, Euler, Quaternion, Vector3, Matrix4} from "three";
import Controller from "node-pid-controller";
let positionVec = new Vector3();
let rotationQuat = new Quaternion();
let rotationEuler = new Euler();
let desiredDestination = new Vector3();
let desiredRotationQuat = new Quaternion();
let desiredRotationEuler = new Euler();
let forward = new Vector3(0, 1, 0);
let matrix = new Matrix4();

const C_PROPORTION = 1;
const C_INTEGRAL = 0;
const C_DERIVATIVE = 0.8;

const getYawPitchRoll = (quat: Quaternion) => {
  const yaw =
    Math.atan2(
      2 * quat.y * quat.w - 2 * quat.x * quat.z,
      1 - 2 * quat.y * quat.y - 2 * quat.z * quat.z
    ) +
    Math.PI / 4;
  const pitch =
    Math.atan2(
      2 * quat.x * quat.w - 2 * quat.y * quat.z,
      1 - 2 * quat.x * quat.x - 2 * quat.z * quat.z
    ) +
    Math.PI / 4;
  const roll =
    Math.asin(2 * quat.x * quat.y + 2 * quat.z * quat.w) + Math.PI / 4;
  return [yaw, pitch, roll];
};

// TODO: Make this behave better when rotating the opposite direction
export class AutoRotateSystem extends System {
  test(entity: Entity) {
    return !!(
      entity.components.isShip &&
      entity.components.rotation &&
      entity.components.autopilot
    );
  }
  update(entity: Entity, elapsed: number) {
    const elapsedRatio = elapsed / 1000;
    const {position, rotation, autopilot} = entity.components;
    if (!position || !rotation || !autopilot?.desiredCoordinates) return;

    const systems = this.ecs.entities.filter(
      s => s.shipAssignment?.shipId === entity.id && s.thrusters
    );
    const rotationMatrix = new Matrix4().makeRotationY(Math.PI);
    desiredDestination.set(
      autopilot.desiredCoordinates?.x,
      autopilot.desiredCoordinates?.y,
      autopilot.desiredCoordinates?.z
    );
    positionVec.set(position.x, position.y, position.z);
    matrix
      .lookAt(positionVec, desiredDestination, forward)
      .multiply(rotationMatrix);
    rotationQuat.set(rotation.x, rotation.y, rotation.z, rotation.w);
    rotationEuler.setFromQuaternion(rotationQuat);
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
    let yawCorrection = autopilot.yawController.update(currentAngles[0]);
    let pitchCorrection = autopilot.pitchController.update(currentAngles[1]);
    let rollCorrection = autopilot.rollController.update(currentAngles[2]);

    // // Set the thruster acceleration to those values
    const thrusters = systems.find(s => s.thrusters);
    if (thrusters?.thrusters) {
      thrusters.updateComponent("thrusters", {
        rotationDelta: {
          x: Math.min(Math.max(pitchCorrection, -1), 1),
          y: Math.min(Math.max(yawCorrection, -1), 1),
          z: Math.min(Math.max(rollCorrection, -1), 1),
        },
      });
    }
  }
}
