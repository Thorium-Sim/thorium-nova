import {KilometerPerSecond} from "server/src/utils/unitTypes";
import {Component} from "../utils";

// TODO April 27, 2022: Add the necessary sound effects
export class isWarpEnginesComponent extends Component {
  static id = "isWarpEngines" as const;

  /** The cruising speed in interstellar space in km/s */
  interstellarCruisingSpeed: KilometerPerSecond = 599600000000;
  /** The cruising speed in solar system space in km/s */
  solarCruisingSpeed: KilometerPerSecond = 29980000;
  /** The min speed (warp 1) compared to the cruising speed. Defaults to 0.01 */
  minSpeedMultiplier: number = 0.01;
  /** How many warp factors there are between min and max inclusive. This does not include emergency or destructive warp which are automatically extrapolated. */
  warpFactorCount: number = 5;
  /** The current warp factor. 0 is full stop. */
  currentWarpFactor: number = 0;
  /** The current warp speed in km/s */
  maxVelocity: number = 0;
  /** The forward acceleration of the ship in km/s. */
  forwardAcceleration: number = 0;
  /** The forward velocity of the ship caused by warp in km/s. */
  forwardVelocity: number = 0;
}
