/**
 * Since the order of system execution matters, we need to import all
 * of the systems and re-export them in an array
 */
import {DataStreamSystem} from "./DataStreamSystem";
import {ImpulseSystem} from "./ImpulseSystem";
import {PassengerDestinationSystem} from "./PassengerDestinationSystem";
import {PassengerMovementSystem} from "./PassengerMovementSystem";
import {RandomMovementSystem} from "./RandomMovementSystem";
import {TimerSystem} from "./TimerSystem";

const systems = [
  PassengerDestinationSystem,
  PassengerMovementSystem,
  TimerSystem,
  ImpulseSystem,
  RandomMovementSystem,
  DataStreamSystem,
];
export default systems;
