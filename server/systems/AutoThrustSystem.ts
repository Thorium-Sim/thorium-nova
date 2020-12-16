import Entity from "server/helpers/ecs/entity";
import System from "server/helpers/ecs/system";
import {Quaternion, Vector3, Matrix4} from "three";
import Controller from "node-pid-controller";
let positionVec = new Vector3();
let rotationQuat = new Quaternion();
let desiredDestination = new Vector3();
let desiredRotationQuat = new Quaternion();
let forward = new Vector3(0, 1, 0);
let matrix = new Matrix4();

const C_PROPORTION = 10;
const C_INTEGRAL = 0.1;
const C_DERIVATIVE = 25;

export class AutoThrustSystem extends System {
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
      s => s.shipAssignment?.shipId === entity.id && s.impulseEngines
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
    desiredRotationQuat.setFromRotationMatrix(matrix);

    if (!(autopilot.speedController instanceof Controller)) {
      autopilot.speedController = new Controller({
        k_p: C_PROPORTION,
        k_d: C_DERIVATIVE,
        k_i: C_INTEGRAL,
        i_max: 1,
      });
    }
    autopilot.speedController.target = 1;
    const distance = positionVec.distanceTo(desiredDestination);
    const rotationDifference = rotationQuat.angleTo(desiredRotationQuat);
    // If we are less than 0.5 degrees off course, activate engines.
    const impulseEngines = systems.find(s => s.impulseEngines);

    if (impulseEngines?.impulseEngines) {
      if (rotationDifference <= 30 * (Math.PI / 180)) {
        const controllerOutput = autopilot.speedController.update(
          -1 * Math.min(impulseEngines.impulseEngines.cruisingSpeed, distance)
        );
        let desiredSpeed = Math.min(
          impulseEngines.impulseEngines.cruisingSpeed,
          Math.max(0, controllerOutput)
        );
        if (distance < 5) {
          desiredSpeed = 0;
        }
        impulseEngines.updateComponent("impulseEngines", {
          targetSpeed: desiredSpeed,
        });
      } else {
        autopilot.speedController.reset();
        impulseEngines.updateComponent("impulseEngines", {targetSpeed: 0});
      }
    }
  }
}