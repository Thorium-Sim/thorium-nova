import {
  Coordinates,
  KiloNewtons,
  MetersPerSecond,
  MetersPerSecondSquared,
  RadiansPerSecond,
  RotationsPerMinute,
} from "server/src/utils/unitTypes";
import {Component} from "../utils";

export class IsThrustersComponent extends Component {
  static id = "isThrusters" as const;

  /** Whether the thrusters are currently thrusting */
  thrusting: boolean = false;
  /** The currently applied direction thruster vector in m/s */
  direction: Coordinates<MetersPerSecond> = new Coordinates();
  /** The current direction thruster acceleration vector in m/s/s */
  directionAcceleration: Coordinates<MetersPerSecondSquared> =
    new Coordinates();
  /** The maximum speed which can be applied by direction thrusters in m/s */
  directionMaxSpeed: MetersPerSecond = 1;
  /** The thrust applied by direction thrusters in kilo-newtons, which affects how fast the ship accelerates based on the mass of the ship. */
  directionThrust: KiloNewtons = 12500;

  /** The current vector of rotation being applied. */
  rotationDelta: Coordinates<RadiansPerSecond> = new Coordinates();
  /** The current rotation velocity in radians per second. */
  rotationVelocity: Coordinates<RadiansPerSecond> = new Coordinates();
  /** The max rotation speed in rotations per minute. */
  rotationMaxSpeed: RotationsPerMinute = 5;
  /** The thrust applied by rotation thrusters in kilo-newtons, which affects how fast the rotation accelerates based on the mass of the ship. */
  rotationThrust: KiloNewtons = 12500;
  /** Rotation velocity scalar used by the autopilot */
  autoRotationVelocity: number = 0;
}
