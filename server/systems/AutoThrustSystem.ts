import Entity from "server/helpers/ecs/entity";
import System from "server/helpers/ecs/system";
import {Quaternion, Vector3, Matrix4} from "three";
import Controller from "node-pid-controller";
import {autopilotGetCoordinates} from "server/helpers/ecsSystems/autopilotGetCoordinates";
let positionVec = new Vector3();
let rotationQuat = new Quaternion();
let desiredDestination = new Vector3();
let desiredRotationQuat = new Quaternion();
let up = new Vector3(0, 1, 0);
let matrix = new Matrix4();
const rotationMatrix = new Matrix4().makeRotationY(-Math.PI);
const LY_IN_KM = 9_460_730_472_580.8;

const IMPULSE_PROPORTION = 10;
const IMPULSE_INTEGRAL = 0.1;
const IMPULSE_DERIVATIVE = 25;
const WARP_PROPORTION = 10;
const WARP_INTEGRAL = 5;
const WARP_DERIVATIVE = 8;

export class AutoThrustSystem extends System {
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
      !autopilot?.forwardAutopilot ||
      !autopilot?.desiredCoordinates
    )
      return;

    const systems = this.ecs.entities.filter(
      s =>
        s.shipAssignment?.shipId === entity.id &&
        (s.impulseEngines || s.warpEngines)
    );
    const isInInterstellar = autopilotGetCoordinates(
      this.ecs.entities,
      entity,
      desiredDestination,
      positionVec
    );
    positionVec.set(position.x, position.y, position.z);
    rotationQuat.set(rotation.x, rotation.y, rotation.z, rotation.w);
    up.set(0, 1, 0).applyQuaternion(rotationQuat);
    matrix.lookAt(positionVec, desiredDestination, up).multiply(rotationMatrix);
    desiredRotationQuat.setFromRotationMatrix(matrix);

    const distanceInKM =
      positionVec.distanceTo(desiredDestination) *
      (isInInterstellar ? LY_IN_KM : 1);
    const rotationDifference = Math.abs(
      rotationQuat.angleTo(desiredRotationQuat)
    );
    const impulseEngines = systems.find(s => s.impulseEngines);
    const warpEngines = systems.find(s => s.warpEngines);

    if (!(autopilot.impulseController instanceof Controller)) {
      autopilot.impulseController = new Controller({
        k_p: IMPULSE_PROPORTION,
        k_d: IMPULSE_DERIVATIVE,
        k_i: IMPULSE_INTEGRAL,
        i_max: 1,
      });
    }
    autopilot.impulseController.target = 1;

    if (!(autopilot.warpController instanceof Controller)) {
      autopilot.warpController = new Controller({
        k_d: WARP_DERIVATIVE,
        k_i: WARP_INTEGRAL,
        k_p: WARP_PROPORTION,
        i_max: 1,
      });
    }
    const impulseEngineSpeed =
      impulseEngines?.impulseEngines?.cruisingSpeed || 1;

    // We want Warp to get us within 15 seconds at impulse of our destination
    autopilot.warpController.target = impulseEngineSpeed * 15;

    // There's a heuristic here for which engine to choose to reach a given destination.
    // Basically, if it would take 15 seconds or less to reach the destination at cruising
    // impulse speed, we should use that. Otherwise, we should use warp.
    const TRAVEL_TIME_THRESHOLD_SECONDS = 15;
    if (
      warpEngines?.warpEngines &&
      distanceInKM / impulseEngineSpeed > TRAVEL_TIME_THRESHOLD_SECONDS
    ) {
      autopilot.impulseController.reset();
      impulseEngines?.updateComponent("impulseEngines", {targetSpeed: 0});
      // Use warp engines
      const warpCruisingSpeed = isInInterstellar
        ? warpEngines.warpEngines.interstellarCruisingSpeed
        : warpEngines.warpEngines.planetaryCruisingSpeed;
      if (rotationDifference <= 10 * (Math.PI / 180)) {
        const controllerOutput = autopilot.warpController?.update(
          -1 * Math.min(warpCruisingSpeed, distanceInKM)
        );
        let desiredSpeed = Math.min(
          warpCruisingSpeed,
          Math.max(0, controllerOutput)
        );
        // Figure out an appropriate warp factor to get us to that speed.
        warpEngines.updateComponent("warpEngines", {maxVelocity: desiredSpeed});
      } else {
        autopilot.warpController?.reset();
      }
    } else if (impulseEngines?.impulseEngines) {
      autopilot.warpController.reset();
      warpEngines?.updateComponent("warpEngines", {
        currentWarpFactor: 0,
        maxVelocity: 0,
      });
      // If we are less than 0.5 degrees off course, activate engines.
      if (rotationDifference <= 10 * (Math.PI / 180)) {
        const controllerOutput = autopilot.impulseController.update(
          -1 *
            Math.min(impulseEngines.impulseEngines.cruisingSpeed, distanceInKM)
        );
        let desiredSpeed = Math.min(
          impulseEngines.impulseEngines.cruisingSpeed,
          Math.max(0, controllerOutput)
        );
        if (distanceInKM < 5) {
          desiredSpeed = 0;
        }
        impulseEngines.updateComponent("impulseEngines", {
          targetSpeed: desiredSpeed,
        });
      } else {
        autopilot.impulseController.reset();
        impulseEngines.updateComponent("impulseEngines", {targetSpeed: 0});
      }
    }
  }
}
