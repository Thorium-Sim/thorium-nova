/**
 * Since the order of system execution matters, we need to import all
 * of the systems and re-export them in an array
 */
import {AutoRotateSystem} from "./AutoRotateSystem";
import {AutoThrustSystem} from "./AutoThrustSystem";
import {DataStreamSystem} from "./DataStreamSystem";
import {EngineVelocityPosition} from "./EngineVelocityPosition";
import {EngineVelocitySystem} from "./EngineVelocitySystem";
import {ImpulseSystem} from "./ImpulseSystem";
import {PassengerDestinationSystem} from "./PassengerDestinationSystem";
import {PassengerMovementSystem} from "./PassengerMovementSystem";
import {PositionVelocitySystem} from "./PositionVelocitySystem";
import {RandomMovementSystem} from "./RandomMovementSystem";
import {RotationSystem} from "./RotationSystem";
import {ThrusterSystem} from "./ThrusterSystem";
import {TimerSystem} from "./TimerSystem";
import {WarpSystem} from "./WarpSystem";

const systems = [
  PassengerDestinationSystem,
  PassengerMovementSystem,
  TimerSystem,
  AutoRotateSystem,
  AutoThrustSystem,
  ThrusterSystem,
  ImpulseSystem,
  WarpSystem,
  RotationSystem,
  EngineVelocitySystem,
  EngineVelocityPosition,
  PositionVelocitySystem,
  RandomMovementSystem,
  DataStreamSystem,
];
export default systems;
