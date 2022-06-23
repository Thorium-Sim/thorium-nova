import {Quaternion, Vector3, Matrix4} from "three";
import Controller from "node-pid-controller";
import {Entity, System} from "../utils/ecs";
import {autopilotGetCoordinates} from "../utils/autopilotGetCoordinates";
import {KM_TO_LY} from "../utils/unitTypes";

let positionVec = new Vector3();
let rotationQuat = new Quaternion();
let desiredDestination = new Vector3();
let desiredRotationQuat = new Quaternion();
let up = new Vector3(0, 1, 0);
let matrix = new Matrix4();
const rotationMatrix = new Matrix4().makeRotationY(-Math.PI);

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

    const [impulseEngines, warpEngines] = this.ecs.entities.reduce(
      (acc: [Entity | null, Entity | null], sysEntity) => {
        if (
          !acc[0] &&
          sysEntity.components.isImpulseEngines &&
          entity.components.shipSystems?.shipSystemIds.includes(sysEntity.id)
        )
          return [sysEntity, acc[1]];
        if (
          !acc[1] &&
          sysEntity.components.isWarpEngines &&
          entity.components.shipSystems?.shipSystemIds.includes(sysEntity.id)
        )
          return [acc[0], sysEntity];
        return acc;
      },
      [null, null]
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
      (isInInterstellar ? 1 / KM_TO_LY : 1);
    const rotationDifference = Math.abs(
      rotationQuat.angleTo(desiredRotationQuat)
    );

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
      impulseEngines?.components.isImpulseEngines?.cruisingSpeed || 1;

    // We want Warp to get us within 15 seconds at impulse of our destination
    autopilot.warpController.target = impulseEngineSpeed * 15;

    // There's a heuristic here for which engine to choose to reach a given destination.
    // Basically, if it would take 15 seconds or less to reach the destination at cruising
    // impulse speed, we should use that. Otherwise, we should use warp.
    const TRAVEL_TIME_THRESHOLD_SECONDS = 15;
    if (
      warpEngines?.components.isWarpEngines &&
      distanceInKM / impulseEngineSpeed > TRAVEL_TIME_THRESHOLD_SECONDS
    ) {
      autopilot.impulseController.reset();
      impulseEngines?.updateComponent("isImpulseEngines", {targetSpeed: 0});
      // Use warp engines
      const warpCruisingSpeed = isInInterstellar
        ? warpEngines.components.isWarpEngines.interstellarCruisingSpeed
        : warpEngines.components.isWarpEngines.solarCruisingSpeed;
      if (rotationDifference <= 10 * (Math.PI / 180)) {
        const controllerOutput = autopilot.warpController?.update(
          -1 * Math.min(warpCruisingSpeed, distanceInKM)
        );
        let desiredSpeed = Math.min(
          warpCruisingSpeed,
          Math.max(0, controllerOutput)
        );
        // Figure out an appropriate warp factor to get us to that speed.
        warpEngines.updateComponent("isWarpEngines", {
          maxVelocity: desiredSpeed,
        });
      } else {
        autopilot.warpController?.reset();
      }
    } else if (impulseEngines?.components.isImpulseEngines) {
      autopilot.warpController.reset();
      warpEngines?.updateComponent("isWarpEngines", {
        currentWarpFactor: 0,
        maxVelocity: 0,
      });
      // If we are less than 0.5 degrees off course, activate engines.
      if (rotationDifference <= 10 * (Math.PI / 180)) {
        const controllerOutput = autopilot.impulseController.update(
          -1 *
            Math.min(
              impulseEngines.components.isImpulseEngines.cruisingSpeed,
              distanceInKM
            )
        );
        let desiredSpeed = Math.min(
          impulseEngines.components.isImpulseEngines.cruisingSpeed,
          Math.max(0, controllerOutput)
        );
        if (distanceInKM < 5) {
          desiredSpeed = 0;
        }
        impulseEngines.updateComponent("isImpulseEngines", {
          targetSpeed: desiredSpeed,
        });
      } else {
        autopilot.impulseController.reset();
        impulseEngines.updateComponent("isImpulseEngines", {targetSpeed: 0});
      }
    }
  }
}
