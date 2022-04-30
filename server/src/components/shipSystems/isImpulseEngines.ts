import {Component} from "../utils";

// TODO April 27, 2022: Add the necessary sound effects
export class IsImpulseEnginesComponent extends Component {
  static id = "isImpulseEngines" as const;

  /** The max speed at full impulse in km/s. */
  cruisingSpeed: number = 1500;

  /** The max speed at emergency impulse in km/s. */
  emergencySpeed: number = 2000;

  /** The force in kilo-newtons which impulse engines apply. */
  thrust: number = 12500;

  /** The desired speed of the ship in km/s. */
  targetSpeed: number = 0;

  /** The forward acceleration of the ship in km/s^2. */
  forwardAcceleration: number = 0;

  /** The forward velocity of the ship in km/s. */
  forwardVelocity: number = 0;
}
