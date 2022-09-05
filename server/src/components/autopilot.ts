import Controller from "node-pid-controller";
import {Coordinates} from "../utils/unitTypes";
import {Component} from "./utils";

export class AutopilotComponent extends Component {
  static id: "autopilot" = "autopilot";
  static serialize(component: Omit<AutopilotComponent, "init">) {
    const {
      yawController,
      pitchController,
      rollController,
      impulseController,
      warpController,
      ...data
    } = component;
    return data;
  }
  destinationWaypointId?: number | null = null;
  /** The desired coordinates of the ship in the current stage. If desiredSolarSystemId is null, then it's interstellar coordinates */
  desiredCoordinates?: Coordinates<number>;
  /** Desired interstellar system. For when we are traveling from one system to another. */
  desiredSolarSystemId?: number | null;
  /** Whether the rotation autopilot is on. */
  rotationAutopilot: boolean = true;
  /** Whether the forward movement autopilot is on. */
  forwardAutopilot: boolean = true;

  yawController?: Controller;
  pitchController?: Controller;
  rollController?: Controller;
  impulseController?: Controller;
  warpController?: Controller;
}
/**
 * Setting course has the following steps:
 * 1. Open up the starmap and find the destination you want to go to
 * 2. Reticles appear on the viewscreen for the Pilot to line
 *    up with.
 * 3. The pilot lines up the course using Thrusters, and clicks
 *    the "Lock In" button. If the current trajectory is within
 *    a certain threshold, the thruster system is locked and the
 *    ship is now on course.
 * 4. The destination entity is stored; the destination position
 *    is looked up by reference.
 */
