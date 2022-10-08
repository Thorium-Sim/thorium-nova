import {Quaternion, Vector3, Matrix4} from "three";
import Controller from "node-pid-controller";
import {Entity, System} from "../utils/ecs";
import {autopilotGetCoordinates} from "../utils/autopilotGetCoordinates";
import {kilometerToLightMinute, KM_TO_LY, lightMinuteToLightYear, lightYearToLightMinute, Radian} from "../utils/unitTypes";
import {pubsub} from "../utils/pubsub";
import {isWarpEnginesComponent} from "../components/shipSystems";

let positionVec = new Vector3();
let rotationQuat = new Quaternion();
let desiredDestination = new Vector3();
const emptyVector = new Vector3(0, 0, 0);
const scaleVector = new Vector3(1, 1, 1);
const shipMatrix = new Matrix4();
const lookVector = new Vector3(0, 0, 1);
let up = new Vector3(0, 1, 0);
let matrix = new Matrix4();
const rotationMatrix = new Matrix4().makeRotationY(-Math.PI);
let desiredRotationQuat = new Quaternion();

const IMPULSE_PROPORTION = 10;
const IMPULSE_INTEGRAL = 0.1;
const IMPULSE_DERIVATIVE = 25;
const WARP_PROPORTION = 1;
const WARP_INTEGRAL = 0;
const WARP_DERIVATIVE = 0.5;

export class AutoThrustSystem extends System {
  updateCount = 0;
  test(entity: Entity) {
    return !!(
      entity.components.isShip &&
      entity.components.rotation &&
      entity.components.autopilot
    );
  }
  preUpdate() {
    this.updateCount = (this.updateCount + 1) % 3;
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
    // Get the current system the ship is in and the autopilot desired system
    const entitySystem = entity.components.position?.parentId
      ? this.ecs.getEntityById(entity.components.position.parentId)
      : null;
    const destinationSystem = entity.components.autopilot?.desiredSolarSystemId
      ? this.ecs.getEntityById(entity.components.autopilot.desiredSolarSystemId)
      : null;

    const isInInterstellar = autopilotGetCoordinates(
      entity,
      entitySystem,
      destinationSystem,
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
      (isInInterstellar ? 1 / lightYearToLightMinute(KM_TO_LY) : 1);

    shipMatrix.compose(emptyVector, rotationQuat, scaleVector);
    const rotatedLookVector = lookVector
      .clone()
      .applyMatrix4(shipMatrix)
      .normalize();

    const rotationDifference =
      (Math.abs(rotationQuat.angleTo(desiredRotationQuat)) / Math.PI) * 180;

    const dotProd = rotatedLookVector.dot(
      desiredDestination.clone().normalize()
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

    // There's a heuristic here for which engine to choose to reach a given destination.
    // Basically, if it would take 15 seconds or less to reach the destination at cruising
    // impulse speed, we should use that. Otherwise, we should use warp.
    const TRAVEL_TIME_THRESHOLD_SECONDS = 15;

    // We want Warp to get us within 15 seconds at impulse of our destination
    autopilot.warpController.target =
      impulseEngineSpeed * TRAVEL_TIME_THRESHOLD_SECONDS;

    // If the rotation is < 0.5˚ off
    const inCorrectDirection = rotationDifference <= 0.5;
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
      if (inCorrectDirection) {
        const controllerOutput = autopilot.warpController?.update(
          -1 * Math.min(warpCruisingSpeed, distanceInKM)
        );
        let desiredSpeed = Math.min(
          warpCruisingSpeed,
          Math.max(0, controllerOutput)
        );
        // Figure out an appropriate warp factor to get us to that speed.
        const currentWarpFactor = getWarpFactorFromDesiredSpeed(
          desiredSpeed,
          warpEngines.components.isWarpEngines,
          isInInterstellar
        );
        warpEngines.updateComponent("isWarpEngines", {
          currentWarpFactor,
        });
      } else {
        autopilot.warpController?.reset();
        warpEngines.updateComponent("isWarpEngines", {currentWarpFactor: 0});
      }
    } else if (impulseEngines?.components.isImpulseEngines) {
      autopilot.warpController.reset();
      warpEngines?.updateComponent("isWarpEngines", {
        currentWarpFactor: 0,
        maxVelocity: 0,
      });
      if (inCorrectDirection) {
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

        // Arbitrary number that gets roughly close to 5 KM away
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
    if (this.updateCount === 0) {
      if (warpEngines) {
        pubsub.publish("pilotWarpEngines", {
          shipId: entity.id,
          systemId: warpEngines?.id,
        });
      }
      if (impulseEngines) {
        pubsub.publish("pilotImpulseEngines", {
          shipId: entity.id,
          systemId: impulseEngines.id,
        });
      }
    }
  }
}

function getWarpFactorFromDesiredSpeed(
  desiredSpeed: number,
  warp: Omit<isWarpEnginesComponent, "init">,
  isInterstellar: boolean = false
) {
  const {
    interstellarCruisingSpeed,
    solarCruisingSpeed,
    minSpeedMultiplier,
    warpFactorCount,
  } = warp;
  const cruisingSpeed = isInterstellar
    ? interstellarCruisingSpeed
    : solarCruisingSpeed;

  const minWarp = cruisingSpeed * minSpeedMultiplier;

  // Calculate max warp speed based on the factor and the number of warp factors
  if (desiredSpeed < 1000) return 0;
  if (desiredSpeed > 1000 && desiredSpeed < minWarp) return 1;
  if (desiredSpeed > cruisingSpeed) return warpFactorCount + 1;

  const speedOutput =
    (desiredSpeed * (warpFactorCount - 1)) / (cruisingSpeed - minWarp) + 1;

  return speedOutput;
}
