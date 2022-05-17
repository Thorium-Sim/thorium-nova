import {Degree, Kilometer} from "../utils/unitTypes";
import {Component} from "./utils";

export class SatelliteComponent extends Component {
  static id = "satellite" as const;
  /**
   * The tilt of the axis of rotation in degrees
   */
  axialTilt: Degree = 23.5;

  /**
   * Orbital mechanics based on Keplerian Elements https://en.wikipedia.org/wiki/Orbital_elements#Keplerian_elements
   * Check this page if you need a visualization https://ciechanow.ski/gps/
   * To simplify it, this doesn't include the Longitude of Ascending Node or the Argument of Periapsis, and
   * True Anomaly is renamed to Orbital Arc to be a little easier to understand.
   * Defaults based on Earth
   */
  /**
   * Distance from the center of the orbit to the furthest point
   */
  semiMajorAxis: Kilometer = 149600000;
  /**
   * The shape of the orbit elliptical compared to a circle. 0 is a circular orbit.
   */
  eccentricity: number = 0.01671022;
  /**
   * Vertical tilt of the orbit in degrees
   */
  inclination: Degree = 0;
  /**
   * Angle where the object currently is in its orbit
   */
  orbitalArc: Degree = 0;
  /**
   * Whether the orbit should be shown on the star map
   */
  showOrbit: boolean = true;

  /**
   * The ID of the parent object.
   */
  parentId?: number | null = null;
}
