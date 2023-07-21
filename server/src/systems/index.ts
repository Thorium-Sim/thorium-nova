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
import {RotationSystem} from "./RotationSystem";
import {ThrusterSystem} from "./ThrusterSystem";
import {TimerSystem} from "./TimerSystem";
import {WarpSystem} from "./WarpSystem";
import {InterstellarTransitionSystem} from "./InterstellarTransitionSystem";
import {ReactorFuelSystem} from "./ReactorFuelSystem";
import {FilterShipsWithReactors} from "./FilterShipsWithReactors";
import {FilterInventorySystem} from "./FilterInventorySystem";
import {ReactorHeatSystem} from "./ReactorHeatSystem";
import {HeatToCoolantSystem} from "./HeatToCoolantSystem";
import {HeatDispersionSystem} from "./HeatDispersionSystem";
import {PowerDrawSystem} from "./PowerDrawSystem";
import {PowerGridSystem} from "./PowerGridSystem";
import {WaypointRemoveSystem} from "./WaypointRemoveSystem";
import {DebugSphereSystem} from "./DebugSphereSystem";

const systems = [
  FilterInventorySystem,
  FilterShipsWithReactors,
  InterstellarTransitionSystem,
  PassengerDestinationSystem,
  PassengerMovementSystem,
  TimerSystem,
  ReactorFuelSystem,
  ReactorHeatSystem,
  PowerDrawSystem,
  PowerGridSystem,
  AutoRotateSystem,
  AutoThrustSystem,
  ThrusterSystem,
  ImpulseSystem,
  WarpSystem,
  RotationSystem,
  EngineVelocitySystem,
  EngineVelocityPosition,
  PositionVelocitySystem,
  WaypointRemoveSystem,
  HeatToCoolantSystem,
  HeatDispersionSystem,
  DebugSphereSystem,
  DataStreamSystem,
];
export default systems;
