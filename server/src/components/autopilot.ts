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
