/**
 * Since the order of system execution matters, we need to import all
 * of the systems and re-export them in an array
 */
import {DataStreamSystem} from "./DataStreamSystem";
import {RandomMovementSystem} from "./RandomMovementSystem";
import {TimerSystem} from "./TimerSystem";

const systems = [TimerSystem, RandomMovementSystem, DataStreamSystem];
export default systems;
