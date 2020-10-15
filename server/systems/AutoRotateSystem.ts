import Entity from "server/helpers/ecs/entity";
import System from "server/helpers/ecs/system";
import {Camera, Euler, Quaternion, Vector3} from "three";
import Controller from "node-pid-controller";
let position = new Vector3();
let rotationQuat = new Quaternion();
let rotationEuler = new Euler();
let desiredDestination = new Vector3();
let desiredRotationQuat = new Quaternion();
let desiredRotationEuler = new Euler();
let forward = new Vector3(0, 1, 0);

const C_PROPORTION = 0.7;
const C_INTEGRAL = 0.1;
const C_DERIVATIVE = 0.2;

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
    const {rotation, autopilot} = entity.components;
    if (!rotation || !autopilot?.desiredCoordinates) return;

    const systems = this.ecs.entities.filter(
      s => s.shipAssignment?.shipId === entity.id && s.thrusters
    );

    desiredDestination.set(
      autopilot.desiredCoordinates?.x,
      autopilot.desiredCoordinates?.y,
      autopilot.desiredCoordinates?.z
    );
    rotationQuat.set(rotation.x, rotation.y, rotation.z, rotation.w);
    rotationEuler.setFromQuaternion(rotationQuat);
    // Use the thrusters to adjust the rotation of the ship to point towards the desired destination.
    // First, determine the angle to the destination.
    desiredRotationQuat.setFromUnitVectors(
      forward.normalize(),
      desiredDestination.normalize()
    );
    desiredRotationEuler.setFromQuaternion(desiredRotationQuat);

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
    autopilot.yawController.target = desiredRotationEuler.y;
    autopilot.pitchController.target = desiredRotationEuler.x;
    autopilot.rollController.target = desiredRotationEuler.z;

    // Update controllers with the current rotation
    let yawCorrection = autopilot.yawController.update(rotationEuler.y);
    let pitchCorrection = autopilot.pitchController.update(rotationEuler.x);
    let rollCorrection = autopilot.rollController.update(rotationEuler.z);

    // Set the thruster acceleration to those values
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
